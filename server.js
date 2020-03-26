require('dotenv').config();

const express = require('express');
const requireDir = require('require-dir');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const compression = require('compression');
const app = express();

nunjucks.configure('./src/views', {
    autoescape: true,
    express: app,
});

requireDir('./src/models');

app.use(compression()); //Compress all routes
app.use(helmet());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()); // Parse JSON bodies (as sent by API clients)

// middleware
app.use(function (req, res, next) {
    res.locals.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.locals.recaptchaPublicKey = process.env.GOOGLE_RECAPTCHA_PUBLIC_KEY;

    next();
});

// routes
app.use('/', require('./src/routes'));

app.listen(process.env.PORT || 3333);
