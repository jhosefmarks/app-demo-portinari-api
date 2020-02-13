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

    if (req.query.transform == 'true') {
      records = records.map(city => ({
        value: city.ibge,
        label: city.name,
        ibge: city.ibge,
        name: city.name,
        state: city.state
      }));
    } else {
      records = records.map(city => ({
        ibge: city.ibge,
        name: city.name,
        state: city.state
      }));
    }

    res.send({
      hasNext: false,
      items: records
    });
  });

  app.get(`${urlApiResource}/:id`, (req, res) => {
    log(`GET ${req.url}`); log(`PARAMS ${JSON.stringify(req.params)}`); log(`QUERY ${JSON.stringify(req.query)}`);

    const records = sql.select(tableName);
    const record = sql.find(records, 'ibge', req.params.id);

    if (req.query.transform === 'true') {
      record.value = record.ibge;
      record.label = record.name;
    }

    log(record);

    if (record) {
      res.send(record);
    } else {
      res.status(404).send(utilsApi.errorGetNotFound(`City`));
    }
  });

};
