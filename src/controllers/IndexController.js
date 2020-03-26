const { validationResult } = require('express-validator');
const mailer = require('../services/mailer');
var sprintf = require('sprintf-js').sprintf;
const axios = require('axios').default;

module.exports = {
    async index(req, res) {
        res.render('../views/index.njk', {});
    },

    async contact(req, res) {
        res.render('../views/contact.njk');
    },

    async contactSubmit(req, res) {
        // Finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('../views/contact.njk', { errors: errors.array() });
        }

        function recaptchaIsValid(recaptchaResponse, remoteAddress) {
            // Validate Google Recaptcha
            var secretKey = process.env.GOOGLE_RECAPTCHA_SECRET;

            // req.connection.remoteAddress will provide IP address of connected user.
            var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + recaptchaResponse + "&remoteip=" + remoteAddress;

            return axios
                .get(verificationUrl).then(function (response) {
                    // Check if validation failed
                    // console.log(response.data)
                    if (response.data.success !== undefined && !response.data.success) {
                        // Failed
                        return false;
                    }

                    return true;

                }).catch(function (error) {
                    console.log(error);

                    return false;
                });
        };

        if (!await recaptchaIsValid(req.body['g-recaptcha-response'], req.connection.remoteAddress)) {
            return res.render('../views/contact.njk', { errors: [{ 'msg': 'Validação do captcha falhou.' }] });
        };

        // Form valid
        var htmlContent = sprintf('Email: %s <br><br> Msg: %s', req.body.email, req.body.msg);

        const msg = {
            from: process.env.SUPPORT_EMAIL,
            to: process.env.SUPPORT_EMAIL,
            subject: 'Contato',
            html: htmlContent,
        };

        mailer.send(msg);

        return res.render('../views/contact.njk', { success: 1 });
    },
};
