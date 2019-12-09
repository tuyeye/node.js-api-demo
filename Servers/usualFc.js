var obj = {};

var db = require('./db');

//用于此逻辑处理--当前时间
function nows() {
    let de = require('moment');
    let des = new de();
    return des.format('YYYY-MM-DD HH:mm:ss');
}

//返回本地时间
obj.dateNow = () => {
    let de = require('moment');
    let des = new de();
    return des.format('YYYY-MM-DD HH:mm:ss');
};

//用于此逻辑处理--返回两个时间的秒数
function jian(t1, t2) {
    let date1 = new Date(t1);
    let date2 = new Date(t2);
    let date3 = (date2.getTime() - date1.getTime()) / 1000;
    return date3;
}

//返回两个时间的秒数
obj.timeSpan = (time1, time2) => {
    //返回两个时间的秒数
    var date1 = new Date(time1);
    var date2 = new Date(time2);
    var date3 = (date2.getTime() - date1.getTime()) / 1000;
    return date3;
}

//返回某张表的不重复ID
obj.id = (name, zhujian, length, callBack) => {
    //返回一个不重复的id
    let random = require('string-random');

    var start = setInterval(() => {
        let rands = random(length, { letters: false });
        db.sql("select * from " + name + " where " + zhujian + "='" + rands + "';", (err, result) => {
            if (result.recordset.length == 0) {
                clearInterval(start);
                callBack(rands);
            }
        })
    }, 1000);
}

//返回详情页
obj.details = (gid, callBack) => {
    db.sql("select * from SysGoods where gid='" + gid + "';", (err, result) => {
        let sq = [], tj = [];
        if (err) callBack({ code: -1, msg: "系统繁忙，请稍后再试！" });
        else if (!result.recordset.length > 0) callBack({ code: -1, msg: "商品带着你的思念一去不复返，山无棱天地合，乃敢与君绝。" });
        else {
            sq = result.recordset[0];
            db.sql("select top 2 * from SysGoods where power='0' order by newid();", (err, result) => {
                if (err) callBack({ code: -1, msg: "系统繁忙，请稍后再试！" });

                else {
                    for (let i of result.recordset) {
                        tj.push({ src: i.src, price: i.price, title: i.desc, gid: i.gid });
                    }
                    callBack({ code: 0, data: sq, tj: tj });
                }
            });
        }
    });
}

//看了又看
obj.huitou = (callBack) => {
    db.sql("select top 2 * from SysGoods order by newid() where power='0';", (err, result) => {
        if (err) callBack({ code: -1, msg: "系统繁忙，请稍后再试！" });

        else {
            let hd = [];
            for (let i of result.recordset) {
                hd.push({ src: i.src, price: i.price, title: i.title });
            }
            callBack({
                code: 0,
                data: hd
            });
        }
    });
}

//返回尺寸颜色对应的价格与库存
obj.GSC = (Tgid, Tsize, Tcolor, callBack) => {

    db.sql("select * from SysGoods where gid='" + Tgid + "';", (err, result) => {
        var out = {};
        if (result.recordset.length == 0) out = { code: -1, msg: "商品不存在" };

        else {
            let objs = JSON.parse(result.recordset[0].size);

            for (var i = 0; i < objs.length; i++) {
                if (objs[i].title == Tsize && objs[i].Color == Tcolor) {
                    out = { code: 0, datas: { price: objs[i].price, stock: objs[i].stock } };
                    break;
                }
            }
        }
        callBack(out);
    })
}

//返回自定义结果与查询条件的dt
obj.ReadTable = (rang, biao, tj, callBack) => {

    let sql = (tj != null) ? "select " + rang + " from " + biao + " where " + tj + ";" : "select " + rang + " from " + biao + ";";
    db.sql(sql, (err, result) => {
        if (err) callBack({ code: -1, msg: err });
        else callBack({ code: 0, data: result.recordset });
    })
}

//接口保护
obj.Limting = (req, sessions, callBack) => {
    //限制域名访问
    let domain = req.headers['referer'].match(/^(\w+:\/\/)?([^\/]+)/i);

    domain = domain ? domain[2].split(':')[0].split('.').slice(-2).join('.') : null;

    if (domain != "twoyecloud.com") {
        callBack({ code: -1, msg: "第三方非法访问，拒绝响应。" });
        return;
    }

    //限制访问次数
    var timeNow = nows();

    if (sessions == null) sessions = [];
    if (sessions.length == 5) {
        //已达到限制点
        if ((jian(sessions[0]["datetime"], sessions.slice(-1)[0]["datetime"]) / 5) < 1) {//"1越大，表示限制越严格"
            var last = jian(sessions.slice(-1)[0]["datetime"], timeNow);
            if (last >= 300) sessions = [];

            else {
                callBack({ code: -1, msg: '你的访问似乎过于频繁，请稍后再试，期间其他操作也将被限制哦。' });
                return;
            }
        }
        else sessions = [];
    }
    else sessions.push({ "datetime": timeNow });
    callBack({ code: 0, data: sessions });
}

//返回商品的支付链接：第一步：监测商品是否存在，第二步，检测库存与价格，第三步，计算价格，返回支付链接
obj.payLink = (datas, callBack) => {

    var ALIS = require('./alibabaPay');

    db.sql("select * from SysGoods where gid='" + datas.gid + "';", (err, result) => {
        if (err) callBack({ code: -1, msg: "系统开了一会儿小差，哔的一下就恍惚了。" });

        else if (result.recordset.length == 0) callBack({ code: -1, msg: "该商品已经不复存在，或许它曾经来过，亦或从未来过，但我至少知道你来过。" });

        else {
            let dt = JSON.parse(result.recordset[0].size);
            let jg = 0, kc = 0;
            let Scount = parseInt(datas.count);

            for (var i = 0; i < dt.length; i++) {
                if (dt[i].title == datas.size && dt[i].Color == datas.color) {
                    jg = parseFloat(dt[i].price).toFixed(2);
                    kc = parseInt(dt[i].stock);
                    break;
                }
            }

            if (kc == 0) callBack({ code: -1, msg: "呀，似乎来晚了一步，卖完了，要不试试其他规格吧。" });

            else if (kc < Scount) callBack({ code: -1, msg: "可能商品太火爆，你选择的数量已经超越了商家的库存。" });

            else {
                let realRMB = (Scount * jg).toFixed(2);
                let rands = datas.oid;
                let wt = JSON.stringify({ size: datas.size, color: datas.color, count: datas.count, payPirce: realRMB });
                let ms = "尺寸：" + datas.size + "，颜色：" + datas.color + "，数量：" + datas.count + "，购买时单价：" + jg + "，待付价格：" + realRMB;

                db.sql("insert into SysOrders(oid,gid,uid,datas,status,createTime) values('" + rands + "','" + datas.gid + "','" + datas.uid + "','" + wt + "','0','" + nows() + "')", (err, result) => {
                    ALIS.paynow("https://www.baidu.com", rands, realRMB, datas.title, ms, "2","100", (resss) => {
                        callBack({ code: 0, link: resss });
                    })
                });
            }
        }
    })
}

//用户登录
obj.UserLogin = (datas, callBack) => {

    const account = datas.account;

    //账号密码登录{account,password}
    if (datas.way == "pass") {
        const password = datas.password;
        var md5 = require("md5");
        let cd = "";
        let shuzi = /^[0-9]+$/;
        let RegTel = /^[1][3,4,5,7,8][0-9]{9}$/;
        let RegEmail = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;

        if (shuzi.test(account)) {

            if (RegTel.test(account)) cd = "utel";

            else if (account.length == 8) cd = "uid";

            else {
                callBack({ code: -1, msg: "输入的账户不是账号、手机号码、邮箱号码的任意一种。" });
                return;
            }
        }
        else {
            if (RegEmail.test(account)) cd = "uemail";
            else {
                callBack({ code: -1, msg: "输入的账户不是账号、手机号码、邮箱号码的任意一种。" });
                return;
            }
        }

        let sqls = "select * from users where  " + cd + " ='" + account + "';";

        db.sql(sqls, (err, result) => {

            if (err) msgs = callBack({ code: -1, msg: "系统繁忙，请稍后再试！" });

            else if (result.recordset.length == 0) callBack({ code: -1, msg: "账号不存在！" });

            else if (result.recordset[0].urank == "-1") callBack({ code: -1, msg: "账号有点风险，限制登录" });

            else if (result.recordset[0].upass != md5(md5(password))) callBack({ code: -1, msg: "账号密码不匹配" });

            else callBack({ code: 0, uid: result.recordset[0].uid });
        });
    }
    //验证码登录{account,UserCode,SysCode}
    else {
        if (datas.UserCode == null) callBack({ code: -1, msg: "你输入的验证码貌似不存在。" });

        else if (datas.SysCode == null) callBack({ code: -1, msg: "验证码已经失效，重新获取一下吧。" });

        else if (datas.UserCode != datas.SysCode) callBack({ code: -1, msg: "验证码不正确哦。" });

        else {

            let sqls = "select * from users where utel='" + account + "';";

            db.sql(sqls, (err, result) => {
                if (err) msgs = "系统繁忙，请稍后再试！";

                else if (result.recordset.length == 0) callBack({ code: -1, msg: "账号不存在" });

                else { callBack({ code: 0, msg: "", uid: result.recordset[0].uid }); }
            });
        }
    }
}


obj.sendMsg = (tel, note, callBack) => {
    let random = require('string-random');

    let sendMsg = require('./sendMsg');

    let rands = random(6, { letters: false });

    sendMsg.send(tel, 269279, [note, rands, "5"], (err, result) => {
        callBack({ rand: rands });
    });
}
//发送验证码
obj.sendInfomation = (data, callBack) => {

    let random = require('string-random');
    let way = data.way, acc = data.acc, note = data.note;
    if (way == "tel") {

        let sendMsg = require('./sendMsg');

        let rands = random(6, { letters: false });

        sendMsg.send(acc, 269279, [note, rands, "5"], (err, result) => { });

        callBack({ code: 0, rand: rands });
    }
    else {
        let nodemailer = require('nodemailer');
        let smtpTransport = nodemailer.createTransport({
            service: 'QQ',
            auth: {
                user: '1547164339@qq.com',
                pass: 'wlabzozdqjkphajd'
            }
        });

        let rands = random(6, { letters: false });
        smtpTransport.sendMail({
            from: `1547164339@qq.com`,
            to: acc,
            subject: note + "验证码",
            html: "你好，你的用于" + note + "的验证码为：" + rands + "，请在5分钟内输入，如非本人操作，请忽略此条邮件。"
        }, (err, res) => { });

        callBack({ code: 0, rand: rands });
    }
}



//校验账号是否存在
obj.IsExitUser = (data, callBack) => {
    let sqls = "select * from users where " + data.type + " ='" + data.account + "';";

    db.sql(sqls, (err, result) => {

        if (err) callBack({ code: -1, msg: "系统繁忙，请稍后再试！" });

        else if (result.recordset.length > 0) callBack({ code: 0, IsExit: true });

        else callBack({ code: 0, IsExit: false });
    });
}





module.exports = obj;  