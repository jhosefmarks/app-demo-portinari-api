const sql = require('../../db/sql');
const log = require('../../utils/utils');
const utilsApi = require('./utils');

const tableName = 'people';
const urlApiResource = `${utilsApi.urlApiBase}/${tableName}`;

const dumpMetadata = version => version < 3 ? ++version : 3;

module.exports  = function(app) {

  app.get(`${urlApiResource}/metadata`, (req, res) => {
    log(`GET ${req.url}`); log(req.params);

    const type = (req.query.type || 'list').toLocaleLowerCase();
    const version = +req.query.version ? dumpMetadata(+req.query.version) : 1;

    const config = sql.select('config');

    if (config.currentVersionMetadata[type] === version) {
      // Deixar 200 pra simulação pois o browser entende que deve ser devolvida o mesmo valor da
      // requisição anterior atrapalhando a simulação
      // res.status(304).send({ version: config.currentVersionMetadata[type] });
      res.status(200).send({ version: config.currentVersionMetadata[type] });
      return;
    }

    const records = sql.select('metadata');
    const metadata = sql.where(records, 'type', type);
    const metadataVersion = sql.find(metadata, 'version', version);

    if (metadataVersion) {
      // Simula atualização do metadados
      config.currentVersionMetadata[type] = version;

      res.send(metadataVersion);
    } else {
      res.status(404).send(errorGetNotFound(`Metadata`));
    }
  });

  app.get(`${urlApiResource}`, (req, res) => {
    log(`GET ${req.url}`); log(req.query);

    const page = +req.query.page || 1;
    const pageSize = +req.query.pageSize || 10;

    const start = utilsApi.startPage(page, pageSize);
    const end = utilsApi.endPage(page, pageSize);

    let records = sql.select(tableName);

    if (req.query.order) {
      const order = req.query.order.replace('city', 'cityName');
      records = sql.orderby(records, order);
    }

    if (req.query.search) {
      records = [
        ...sql.like(records, 'name', req.query.search),
        ...sql.like(records, 'nickname', req.query.search),
        ...sql.like(records, 'email', req.query.search),
        ...sql.like(records, 'cityName', req.query.search),
        ...sql.like(records, 'genreDescription', req.query.search)
      ];

      records = utilsApi.removeDuplicates(records);
    }

    if (req.query.name) { records = sql.like(records, 'name', req.query.name); }
    if (req.query.nickname) { records = sql.like(records, 'nickname', req.query.nickname); }
    if (req.query.email) { records = sql.like(records, 'email', req.query.email); }
    if (req.query.city) { records = sql.like(records, 'city', req.query.city); }
    if (req.query.genre) { records = sql.where(records, 'genre', req.query.genre); }

    if (req.query.status) {
      let recordsWithStatus = [];

      const statusArr = typeof req.query.status === 'string'
        ? req.query.status.split(',')
        : req.query.status;

      statusArr.forEach(status => {
        recordsWithStatus = [...recordsWithStatus, ...sql.where(records, 'status', status)]
      });

      records = recordsWithStatus;
    }

    const hasNext = records.length > end;

    records = [...records.slice(start, end)];

    records = records.map(person => ({
      id: person.id,
      name: person.name,
      birthdate: person.birthdate,
      genre: person.genre,
      city: person.cityName,
      status: person.status,
      nickname: person.nickname,
      email: person.email
    }));

    res.send({
      hasNext: hasNext,
      items: records
    });
  });

  app.get(`${urlApiResource}/:id`, (req, res) => {
    log(`GET ${req.url}`); log(req.params);

    const records = sql.select(tableName);
    const record = sql.find(records, 'id', req.params.id);

    if (record) {
      res.send(record);
    } else {
      res.status(404).send(utilsApi.errorGetNotFound(`Person`));
    }
  });

  app.post(`${urlApiResource}`, (req, res) => {
    log(`POST ${req.url}`); log(req.body);

    const person = req.body || {};
    const errors = [];

    person.id = ((new Date()).getTime()).toString();

    if (!person.name) { errors.push('Name is required.'); }

    if (!person.email) { errors.push('E-mail is required.'); }
    if (person.email && !person.email.includes('@')) { errors.push('Invalid e-mail.'); }

    if (!person.status) { errors.push('Status is required.'); }
    if (person.status && ![ 'active', 'inactive' ].includes(person.status.toLocaleLowerCase())) {
      errors.push('Invalid values for Status.');
    }

    if (errors.length > 0) {
      const errorMsg = utilsApi.responseMsg(400, 'Bad Request.', 'Invalid resource.');

      errorMsg.details = [];

      errors.forEach(error => errorMsg.details.push(utilsApi.responseMsg('0001', error, error)));

      res.status(400).send(errorMsg);
      return;
    }

    if (!(person.dependents instanceof Array)) {
      person.dependents = [];
    }

    sql.insert(tableName, person);

    res.status(201).send(person);
  });

  app.put(`${urlApiResource}/:id`, (req, res) => {
    log(`PUT ${req.url}`); log(req.params); log(req.body);

    const people = sql.select(tableName);
    const person = sql.find(people, 'id', req.params.id);

    log(people.map(p => p.id));
    log(people.find(record => record['id'] == '1581552042308'));

    log(person);

    if (!person) {
      res.status(404).send(utilsApi.errorGetNotFound(`Person`));
      return;
    }

    const errors = [];
    const personUpdated = req.body || {};

    if (person.name !== personUpdated.name) { errors.push('Name cannot be updated.'); }
    if (person.email !== personUpdated.email) { errors.push('E-mail cannot be updated.'); }
    if (person.status !== personUpdated.status) { errors.push('Status cannot be updated.'); }
    if (person.status !== 'active') { errors.push('Customer inactive cannot be updated.'); }

    if (errors.length > 0) {
      const errorMsg = utilsApi.responseMsg(400, 'Bad Request.', 'Invalid resource.');

      errorMsg.details = [];

      errors.forEach(error => errorMsg.details.push(utilsApi.responseMsg('0001', error, error)));

      res.status(400).send(errorMsg);
      return;
    }

    if (!(person.dependents instanceof Array)) {
      person.dependents = [];
    }

    sql.update(tableName, personUpdated, 'id', req.params.id);

    res.status(201).send(person);
  });

  app.delete(`${urlApiResource}`, (req, res) => {
    log(`DELETE ALL ${req.url}`); log(req.body);

    const people = sql.select(tableName);
    let deletePeople = 0;

    req.body.forEach(person => {
      const index = sql.findIndex(people, 'id', person.id);

      if (index > -1) {
        sql.remove(tableName, 'id', person.id);
        deletePeople++;
      }
    });

    log(`Records deleted: ${deletePeople}`);

    if (deletePeople > 0) {
      res.sendStatus(204);
    } else {
      res.status(400).send(utilsApi.errorDeleteNotFound(`People`));
    }
  });

  app.delete(`${urlApiResource}/:id`, (req, res) => {
    log(`DELETE ${req.url}`); log(req.params);

    const people = sql.select(tableName);
    const person = sql.find(people, 'id', req.params.id);

    if (!person) {
      res.status(404).send(utilsApi.errorGetNotFound(`Person`));
      return;
    }

    sql.remove(tableName, 'id', req.params.id);

    res.status(204).send(person);
  });

};
