const sql = require('../../db/sql');
const log = require('../../utils/utils');
const utilsApi = require('./utils');

const tableName = 'cities';
const urlApiBase = `${utilsApi.urlApiBase}/${tableName}`;

module.exports  = function(app) {

  app.get(`${urlApiBase}`, (req, res) => {
    log(`GET ${req.url}`); log(req.query);

    let records = sql.select(tableName);

    if (req.query.search) {
      records = sql.like(records, 'name', req.query.search);

      records = utilsApi.removeDuplicates(records, 'ibge');
    }

    if (req.query.name) { records = sql.like(records, 'name', req.query.name); }
    if (req.query.ibge) { records = sql.like(records, 'ibge', req.query.ibge); }
    if (req.query.state) { records = sql.like(records, 'state', req.query.state); }

    records = records.map(city => ({
      ibge: city.ibge,
      name: city.name,
      state: city.state
    }));

    res.send({
      hasNext: false,
      items: records
    });
  });

};
