const sql = require('../../db/sql');
const log = require('../../utils/utils');
const utilsApi = require('./utils');

const tableName = 'cities';
const urlApiResource = `${utilsApi.urlApiBase}/${tableName}`;

module.exports  = function(app) {

  app.get(`${urlApiResource}`, (req, res) => {
    log(`GET ${req.url}`); log(req.query);

    const search = req.query.search || req.query.filter;
    let records = sql.select(tableName);

    if (search) {
      records = sql.like(records, 'name', search);

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

  app.get(`${urlApiResource}/data-source`, (req, res) => {
    log(`GET ${req.url}`); log(req.query);

    const search = req.query.search || req.query.filter;
    let records = sql.select(tableName);

    if (search) {
      records = sql.like(records, 'name', search);

      records = utilsApi.removeDuplicates(records, 'ibge');
    }

    if (req.query.name) { records = sql.like(records, 'name', req.query.name); }
    if (req.query.ibge) { records = sql.like(records, 'ibge', req.query.ibge); }
    if (req.query.state) { records = sql.like(records, 'state', req.query.state); }

    records = records.map(city => ({
      value: city.ibge,
      label: city.name,
      state: city.state
    }));

    res.send({
      hasNext: false,
      items: records
    });
  });

};
