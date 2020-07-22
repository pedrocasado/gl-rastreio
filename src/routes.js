const express = require('express');
const routes = express.Router();
const { check } = require('express-validator');

const TrackController = require('./controllers/TrackController');
const IndexController = require('./controllers/IndexController');

routes.get('/', IndexController.index);
routes.get('/contact', IndexController.contact);
routes.post(
    '/contact',
    [check('email').isEmail().withMessage('Email inválido.'), check('msg', 'Mensagem inválida.').isLength({ min: 10 }), check('g-recaptcha-response').notEmpty()],
    IndexController.contactSubmit,
);
routes.get('/track/:acn([0-9]{3})/:ref([0-9]{7,10})', TrackController.index);
routes.get('/track/:acn([0-9]{3})/:ref([0-9]{7,10})/json', TrackController.index);
routes.get('/ipif', TrackController.status);

module.exports = routes;
