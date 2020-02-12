const sql = require('../../db/sql');
const log = require('../../utils/utils');
const utilsApi = require('./utils');

const tableName = 'states';
const urlApiResource = `${utilsApi.urlApiBase}/${tableName}`;

module.exports  = function(app) {

  app.get(`${urlApiResource}`, (req, res) => {
    log(`GET ${req.url}`); log(req.query);

    const search = req.query.search || req.query.filter;
    let records = sql.select(tableName);

    if (search) {
      records = sql.like(records, 'name', search);

      records = utilsApi.removeDuplicates(records, 'uf');
    }

    if (req.query.name) { records = sql.like(records, 'name', req.query.name); }
    if (req.query.uf) { records = sql.like(records, 'uf', req.query.uf); }

    records = records.map(city => ({
      uf: city.uf,
      name: city.name
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

      records = utilsApi.removeDuplicates(records, 'uf');
    }

    if (req.query.name) { records = sql.like(records, 'name', req.query.name); }
    if (req.query.uf) { records = sql.like(records, 'uf', req.query.uf); }

    records = records.map(city => ({
      value: city.uf,
      label: city.name
    }));

    res.send({
      hasNext: false,
      items: records
    });
  });

};
