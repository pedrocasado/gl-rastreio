require('dotenv').config();

const requestIp = require('request-ip');
const express = require('express');
const requireDir = require('require-dir');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const compression = require('compression');
const app = express();
const { RateLimiterMemory } = require('rate-limiter-flexible');
const cron = require('node-cron');
const { Log } = require('./src/models');
const { Op } = require('sequelize');
const mailer = require('./src/services/mailer');
const db = require('./src/models/index');

// second	0-59 (optional)
// minute	0-59
// hour	0-23
// day of month	1-31
// month	1-12 (or names)
// day of week	0-7 (or names, 0 or 7 are sunday)

// runs once a week on monday
cron.schedule('0 9 * * 1', () => {
    // check for errors and mail
    const pastSevenDays = new Date();
    pastSevenDays.setDate(pastSevenDays.getDate() - 17);

    Log.findAll({
        attributes: ['ip', [db.sequelize.fn('COUNT', db.sequelize.col('ip')), 'n_ips']],
        where: {
            dt_created: {
                [Op.lt]: new Date(),
                [Op.gt]: pastSevenDays,
            },
        },
        group: 'ip',
        // order: [['count(ip)', 'DESC']],
    }).then((result) => {
        let htmlMessage = '';

        result.forEach((log) => {
            htmlMessage = htmlMessage + log.dataValues.ip + ' - ' + log.dataValues.n_ips + '<br />';
        });

        const msg = {
            from: process.env.SUPPORT_EMAIL,
            to: process.env.SUPPORT_EMAIL,
            subject: 'Ips count from last week',
            html: htmlMessage,
        };

        mailer.send(msg);
    });
});

// runs every day at 9
cron.schedule('0 9 * * *', () => {
    // check for errors and mail
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    Log.count({
        where: {
            json_response: {
                [Op.startsWith]: '{"message', // LIKE 'str%'
            },
            dt_created: {
                [Op.lt]: new Date(),
                [Op.gt]: yesterday,
            },
        },
        order: [['id', 'DESC']],
        limit: 500,
    }).then((result) => {
        if (result > 0) {
            console.log(result + 'errors detected.');

            const msg = {
                from: process.env.SUPPORT_EMAIL,
                to: process.env.SUPPORT_EMAIL,
                subject: 'GL API ERROR',
                html: 'Check log table for errors.',
            };

            mailer.send(msg);
        }
    });
});

nunjucks.configure('./src/views', {
    autoescape: true,
    express: app,
});

requireDir('./src/models');

app.use(requestIp.mw());
app.use(compression()); //Compress all routes
app.use(helmet());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()); // Parse JSON bodies (as sent by API clients)

// setup rate limiter middleware
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware-limiter',
    points: 50, // 50 requests
    duration: 3600, // per 1 hour by ip
});

const rateLimiterMiddleware = (req, res, next) => {
    rateLimiter
        .consume(req.clientIp)
        .then(() => {
            next();
        })
        .catch(() => {
            Log.create({
                acn: req.params.acn,
                ref: req.params.ref,
                ip: req.clientIp || '127.0.0.1',
                json_response: JSON.stringify({ error: 'rate limit' }),
                dt_created: Date.now(),
            });

            return res.status(429).json({ error: 'Muitas requisições (limite 50 requisições/hora). Para aumentar o limite entre em contato conosco.' });
        });
};

app.use('/track/:acn([0-9]{3})/:ref([0-9]{7,10})', rateLimiterMiddleware);

// setup local variables middleware
app.use(function (req, res, next) {
    res.locals.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.locals.recaptchaPublicKey = process.env.GOOGLE_RECAPTCHA_PUBLIC_KEY;

    next();
});

// routes
app.use('/', require('./src/routes'));

app.listen(process.env.PORT || 3333);

console.log('Listening: http://127.0.0.1:' + process.env.PORT);
