var QcloudSms = require("qcloudsms_js");
var obj = {};
obj.send = function (telNum, ID, shuzu, callback) {
    var appid = 1400133371;
    var appkey = "b5fddee90056d0f8f134d75b8c1eac61";
    var phoneNumbers = telNum;
    var templateId = ID;
    var smsSign = "TwoYe途耶呐";
    var qcloudsms = QcloudSms(appid, appkey);
    var result_T = "";

    function callback(err, res, resData) {
        if (err) {
            result_T = err;
        }
        else {
            result_T = "发送成功";
        }
    }

    var ssender = qcloudsms.SmsSingleSender();
    var params = shuzu;
    ssender.sendWithParam(86, phoneNumbers, templateId, params, smsSign, "", "", callback);
    callback(null, result_T)
}

module.exports = obj;
