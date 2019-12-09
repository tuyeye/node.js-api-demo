var express = require('express');
const http = require('http'), https = require('https'), fs = require('fs');
var bodyParser = require('body-parser');//引入body parser用于解析post的body
var session = require('express-session');

var usualFc = require('./Servers/usualFc');
var db = require('./Servers/db');
var md5 = require("md5");

var app = express();
app.use(bodyParser.json());//使用body parser用于解析post的body
app.use(bodyParser.urlencoded({ extended: true }));//使用body parser用于解析post的body

// 使用 session 中间件
app.use(session({
    secret: 'secret', // 对session id 相关的cookie 进行签名
    resave: true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie: {
        maxAge: 1000 * 60 * 3, // 设置 session 的有效时间，单位毫秒
    },
}));


app.all('*', function (req, res, next) {
    //跨域请求
    const origin = req.headers.origin
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    usualFc.Limting(req, req.session.open, (data) => {
        //接口保护，防止频繁访问
        if (data.code == -1) {
            res.send(data);
            return;
        }
        else {
            req.session.open = data.data;
            next();
        }
    });
})

app.use(express.static('public'));

app.post('/apiConcc', (req, res) => {
    let ALIS = require('./Servers/alibabaPay');
    let random = require('string-random');
    ALIS.paynow("https://www.baidu.com", random(12, { letters: false }), "1.00", "datas.title", "ms", "4", "200", (resss) => {
        res.send({ code: 0, link: resss });
    })
});

//return a link about the order
app.post('/Paylink', (req, res) => {
    let data = req.body;
    let uid = data.uid, key = data.key, oid = data.oid, title = data.title, specs = data.specs, count = data.count, price = data.price;
    let lks = "http://localhost:3000/twoyePay?uid=" + uid + "&key=" + key + "&oid=" + oid + "&title=" + title + "&specs=" + specs + "&count=" + count + "&price=" + price;
    res.send({ code: 0, link: lks });
});

//Public PayPage Creating a order in twoye database then return a link to visit for the visitor.
app.post('/alipay', (req, res) => {
    let ALIS = require('./Servers/alibabaPay');
    let data = req.body;
    let uid = data.uid, key = md5(data.key), oid = data.oid, title = data.title, specs = data.specs, count = data.count, price = parseFloat(data.price).toFixed(2);

    usualFc.ReadTable("*", "users", "uid='" + uid + "' and upass='" + key + "';", (resss) => {
        if (resss.code == -1) res.send({ code: -1, msg: "The system refuses to respond, either because it has not signed or because the password of the account does not match." })
        else {
            let datas = resss.data[0];

            if (datas.returnUrl == "") res.send({ code: -1, msg: "The ReturnUrl is Null" });
            else {
                ALIS.paynow("https://www.baidu.com", oid, price, title, (specs + " 数量：" + count), "4", "200", (resss) => {
                    res.send({ code: 0, link: resss, data: { utel: datas.utel, uname: uname, oid: oid, title: title, specs: specs, count: count, price: price } });
                })
            }
        }
    })
});

//登录
app.post('/login', (req, res) => {
    let data = req.body;
    let fas = (data.password != null) ? { account: data.account, password: data.password, way: "pass" } : { account: data.account, UserCode: data.usercode, SysCode: req.session.rand, way: "vail" };

    usualFc.UserLogin(fas, (resss) => {
        if (resss.code == -1) res.send({ code: -1, msg: resss.msg });
        else {
            req.session.user = resss.uid;
            res.send({ code: 0 });
        }
    });
});

//读取数据
app.post('/datas', (req, res) => {
    let data = req.body;
    let theRang = data.rang, theBiao = data.biao, theTj = data.tj;

    usualFc.ReadTable(theRang, theBiao, theTj, (resss) => { res.send(resss); })
})

//发送验证码信息
app.post('/sendInfo', (req, res) => {
    let data = req.body;

    if (req.session.sendDate != null && usualFc.timeSpan(req.session.sendDate, usualFc.dateNow()) < 120) {
        res.send({ code: -1, msg: "请在120秒后再试。" });
    }
    else {
        usualFc.sendInfomation({ way: data.way, acc: data.acc, note: data.note }, (resss) => {
            if (resss.code == -1) res.send(resss);
            else {
                req.session.sendDate = usualFc.dateNow();
                req.session.rand = resss.rand;
                res.send({ code: 0 });
            }
        })
    }
});

//注册
app.post('/register', (req, res) => {
    let data = req.body;
    if (data.step == 0) {
        usualFc.IsExitUser({ type: "utel", account: data.tel }, (resss) => {
            if (resss.code == -1) res.send(resss);
            else {
                if (resss.IsExit) res.send({ code: -1, msg: "此手机号码已被注册，请更换其他手机号码。" });
                else res.send({ code: 0 });
            }
        });
    }
    else if (data.step == 2) {
        let rand = data.theRand;

        if (req.session.rand == null) res.send({ code: -1, msg: "验证码未获取或者已失效，请重新获取。" });
        else if (rand != req.session.rand) res.send({ code: -1, msg: "验证码不正确。" });
        else res.send({ code: 0 });
    }
    else if (data.step == 3) {
        //注册
        let tel = data.tel, pass = md5(md5(data.pass));

        usualFc.id("users", "uid", 8, (resss) => {
            db.sql("insert into users(uid,utel,upass,createtime,uname) values('" + resss + "','" + tel + "','" + pass + "','" + usualFc.dateNow() + "','暂未设置昵称');", (err, result) => {
                if (err) res.send({ code: -1, msg: "系统繁忙，请稍后再试。" });
                else res.send({ code: 0, msg: "注册成功。", uid: result });
            });
        })
    }

})

app.post('/ucenter', function (req, res) {
    let data = req.body;
    let option = data.option;

    if (req.session.user == null) {
        res.send({
            code: -1,
            msg: "未检测到登录信息，请登录后再尝试。",
            uid: "none"
        });
        return;
    }
    if (option == "1") {
        db.sql("select * from users where uid ='" + req.session.user + "';", function (err, result) {

            if (err) msgs = "系统繁忙，请稍后再试！";
            else {
                res.send({
                    code: 0,
                    data: {
                        uid: req.session.user,
                        createtime: result.recordset[0].createtime,
                        urank: result.recordset[0].urank,
                        ubusiness: result.recordset[0].ubusiness,
                        utel: result.recordset[0].utel,
                        uemail: result.recordset[0].uemail,
                        alipay: result.recordset[0].alipay,
                        QQ: result.recordset[0].QQ
                    },
                    uid: req.session.user
                }
                );
            }

        });
    }
})

app.post('/sessionOp', (req, res) => {
    let data = req.body;
    let option = data.option;
    var codes = req.session.user == null ? -1 : 0;
    if (option == "check") res.send({ code: codes });

    if (option == "logout") {
        req.session.user = null;
        res.send({ code: 0 });
    }
})

app.post('/indexLoad', function (req, res) {
    let data = req.body;
    let positon = data.position;
    let rq = [];
    if (positon == "1") {
        //left1 权重0
        db.sql("select * from SysGoods where power='0';", function (err, result) {
            if (err) res.send({
                code: -1,
                msg: "系统繁忙，请稍后再试。"
            })
            else {
                let ress = result.recordset;
                let cso = [];
                for (var i = 0; i < result.recordset.length; i++) {
                    rq.push(
                        {
                            gid: ress[i].gid,
                            desc: ress[i].desc,
                            src: ress[i].src,
                            price: ress[i].price,
                            pre_price: ress[i].pre_price,
                            coll: ress[i].coll,
                            coms: ress[i].coms,
                            sale: ress[i].sale
                        }
                    );
                }
                db.sql("select * from System where id=1;", function (err, result) {
                    if (err) res.send({
                        code: -1,
                        msg: "系统繁忙，请稍后再试。"
                    })
                    else {
                        var te = JSON.parse(result.recordset[0].carousel);
                        for (var i = 0; i < te.length; i++) {
                            cso.push(
                                {
                                    index: te[i].index,
                                    src: te[i].src,
                                    to: te[i].to
                                }
                            );

                        }
                        res.send({ code: 0, data: rq, carousel: cso });
                    }
                });
            }
        });
    }

})

app.post('/detail', function (req, res) {
    let data = req.body;
    let gid = data.gid;
    let op = data.option;

    if (op == "0") usualFc.details(gid, (resss) => { res.send(resss); });

    else if (op == "1") {
        usualFc.GSC(gid, data.SelectSize, data.SelectColor, (resss) => {

            if (resss.code == null) res.send({ code: -1, msg: "找不到" + data.SelectSize + "，" + data.SelectColor + "的价格与库存信息，可能这件商品已经下架了或者其他原因。" });

            else res.send({ code: 0, data: resss.datas });
        });
    }

    else if (op == "2") usualFc.huitou((resss) => { resss.send(resss) });
})


//支付宝支付
app.post('/alipay', function (req, res) {
    let data = req.body;

    if (req.session.user == null) {
        res.send({ code: -102 });
        return;
    }

    usualFc.id("SysOrders", "oid", 12, (resss) => {
        let to = {
            gid: data.gid,
            size: data.size,
            color: data.color,
            count: data.count,
            title: data.title,
            uid: req.session.user,
            oid: resss
        };
        usualFc.payLink(to, (data) => { res.send(data); });
    });
})

//同步读取密钥和签名证书
var options = {
    key: fs.readFileSync('/root/Nserver/keys/server.key'),
    cert: fs.readFileSync('/root/Nserver/keys/server.pem')
}

var httpsServer = https.createServer(options, app);
var httpServer = http.createServer(app);

//https监听3000端口
httpsServer.listen(443);
//http监听3001端口
httpServer.listen(3001);

process.on('uncaughtException', (err) => {
    //线程保护
    console.log(err);
    console.log("捕捉到异常啦");
});