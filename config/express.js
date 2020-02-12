const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet')
const routes = require('../app/routes');

const app = express();

app.use(helmet());

app.use(cors({
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  origin: '*'
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

routes(app);

module.exports = app;
