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

    if (req.query.transform === 'true') {
      records = records.map(state => ({
        value: state.uf,
        label: state.name,
        uf: state.uf,
        name: state.name
      }));
    } else {
      records = records.map(state => ({
        uf: state.uf,
        name: state.name
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
    const record = sql.find(records, 'uf', req.params.id);

    if (req.query.transform === 'true') {
      record.value = record.uf;
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
