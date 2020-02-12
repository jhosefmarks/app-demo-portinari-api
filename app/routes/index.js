const sql = require('../../db/sql');
const log = require('../../utils/utils');
const utilsApi = require('./utils');

const people = require('./people');
const cities = require('./cities');
const states = require('./states');

module.exports = function(app) {

  people(app);
  cities(app);
  states(app);

  app.get(`${utilsApi.urlApiBase}/reload`, (req, res) => {
    log('RELOAD DB');

    sql.initDB();

    res.sendStatus(200);
  });

  app.all('/*', function(req, res) {
    log(`* ${req.url}`); log(req.params); log(req.query); log(req.body);

    res.status(400).send(utilsApi.responseMsg(400, 'Bad Request.', 'Invalid endpoint.'));
  });

};
