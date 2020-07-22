require('dotenv').config();

const requestIp = require('request-ip');
const express = require('express');
const requireDir = require('require-dir');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const compression = require('compression');
const app = express();
const { RateLimiterMemory } = require('rate-limiter-flexible');

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
        .consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            return res.status(429).json({ error: 'Muitas requisições (limite 50 requisições/hora). Para aumentar o limite entre em contato conosco.' });
        });
};

app.use('/track/', rateLimiterMiddleware);

// setup local variables middleware
app.use(function (req, res, next) {
    res.locals.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.locals.recaptchaPublicKey = process.env.GOOGLE_RECAPTCHA_PUBLIC_KEY;

    next();
});

// routes
app.use('/', require('./src/routes'));

app.listen(process.env.PORT || 3333);
