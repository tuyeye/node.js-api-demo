var obj = {};
const AlipaySdk = require('alipay-sdk').default;
const alipaySdk = new AlipaySdk({
    appId: '2018102061799109',
    privateKey: "MIIEpgIBAAKCAQEAumLmbkx8zo3b1LvDoaKcaVzUHbvyIy0RiMWH4i5gKxAuIiwVYIQtezpna3h0MZs9vkrgcZJS5YWiJVgg6KZj3FMLDPH9ScEzwRDEUu51hgX9bXWshEu90wVWfKBW2GiK8jBDJTGY25KePL8Al+rrJxnB86+a0FdsQxzY0M2im2ZFKVnavC2upYLwbnBSx+Ub0W6E1nHhLaDLBYu9XCSV0WlpXV/TS0GP45ZaEkFCUNDCrmMeeix8rSS7BAAGSADi4+3ynBUZkreQsMkwS63tXcDKElSS25FxXCdM8JG97ndHLCrWqnkpPaOBbsENEl4EXYUucx7c2rWyowhD0qKaiwIDAQABAoIBAQCIgudC4cKHhl778InYWME2akbxgDZYjSnKguKDRnQpFjCz1pXRmv20w5H7pL11l74hIbZBeGo+sSGROHrh6vw44pm1YYeh/V9qiF1CYGSzRK/Y+9bfDpp5c+9kWAtDdU5PFAoZs7nBGCHNXBeTLPwOJ09mq7c34M/qV7Z1OCdgqMbbpHuNkys6bkKSsqYoU1HP7XtLqhMCqOhSSP5eKVVLzPyIFq+WCC4jSTndnOWkAFIo6FU7AxazoiJRnHoqhhetyqX3UGIIVA9WYnvxskFSFhvePIsYHct830CH1XHUhJe8L23tSoXfU6R6Tqdk3dgTzLBT+Gdou0zo/8fFIcQBAoGBAOF9A+CyzNmdFlkWoHdZrPeqaEobRi6i6Euz0DDwyuY9X98UKCWfdI+mnqEi+YH4aTqQ1f3U7XR94fG9Lev5JXpfDNPGvPW8LntkMyoZ02oqkOPvm/3bvFH9O5vLrgUbblt464YgRBanZUDYMEhQANIStMFiOScCiSuJgDxVyTnFAoGBANObYR3zdFOYVLa9ljW9cYQ4b6Q9XFgw+Me1I5D9OrEAZf9APYaFRibrF/5cC1FoPp/J9DhZro2yB55VgSTaHqOiZG2rwMtNB+7X7Pdo5zYJFAGBI+GwbNNz2vsBRg9MmcBYwXq2R5K0fFrL4dOAzNQpKtt729YYKNQMJtSaUtgPAoGBAMv091/0esRPiZpVlBnAfGqcsa5uUyH16qYm5CaQdwag9ynhopq9S4JwFMXty7/bANufjGAHjC01e/zbwEDUYCj69rBL8DlZ2LV1oa3wJEHAdMQnxHJvojyLELLQHfyynjSRAICWiN/w0+4+XhXaf5OEpgjRnp6Bda9ytRJeCiB9AoGBANM51+C441aKyY08hFOSjlzIpRCSO7rA76USOLWDQXHsDuSTsJa2NIemxuWd5aJWZ6TDSChzxR0mKBqyCV7K6Ci5cnxTJPkLJK8TFTUGnz2+JB04VqPzoz4T+PPzmoatFRD+x+uBRsK3rSZJPFwOxufFTEWZRqFYrnC0zJIOlkGbAoGBAKd6Tj8qol+u8X/sc0BC+CX/ppvSeQ4bLZx2wL///l7puGk4Gn2ezZY5YyDIUcOUHEChHutB7SsHpwJIhpTL6zgUSDKqb5WGAjCsDdap8RQs89MBy10A97yoS0PvXe+va6P6z0M2zZjGKWnjpk/tYVyLYa3gs47EL0W7Q+hvMJjg",
    alipayPublicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqknNAcmP+8UsLPvxUpzBmHRihQP5+zQG/OCksqZAwaojvBN6iHsoZ2QSTP5wPelkKuFY1QG3OiGTWPjaylNu6mH19l3gfY1lBir6+DIt6FrWyXMfRs+/XowRJv/dleGYn04Nd6SFMguZ1HTB0zotkwRZrNC97xQHIQbqSMaqa5SzaHn7pC2me67uMPvQkgXEqiu08pFE6DnZreVASbR5nRqKgeoLc5xZ61IwZREkv70cdPOHKuRJNYlixk+AnmvabA5Bj6vwiCsFYZOsSBqgBiIKUdHdun5rJzsNqM55M81B8NhyWPyOqEIQ2wAFxsQTLiQBPREiGBZDN7kGLgPsDQIDAQAB",
});

//网页支付扫码接口
obj.paynow = (notifyUrl, outTradeNo, totalAmount, subject, body, qr_pay_mode,qrcode_width,callBack) => {

    const AlipayFormData = require('alipay-sdk/lib/form').default;
    const formData = new AlipayFormData();

    formData.setMethod('get');
    formData.addField('notifyUrl', notifyUrl);
    formData.addField('returnUrl', "/returnURL");
    formData.addField('bizContent', {
        outTradeNo: outTradeNo,
        productCode: "FAST_INSTANT_TRADE_PAY",
        totalAmount: totalAmount,
        subject: subject,
        body: body,
        qr_pay_mode:qr_pay_mode,
        qrcode_width:qrcode_width
    });

    alipaySdk.exec('alipay.trade.page.pay', {}, { formData: formData }).then(result => {
        callBack(result);
    }).catch((err) => { callBack(err); });
}

module.exports = obj;  