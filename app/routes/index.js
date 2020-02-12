const database = require('../../db/db');

const urlApiBase = '/api/samples/v1/people';

let db;

const initDB = () => db = JSON.parse(JSON.stringify(database));

const startPage = (page = 1, pageSize = 10) => (page - 1) * pageSize;
const endPage = (page, pageSize) => startPage(page, pageSize) + pageSize;

const select = table => db[table];
const like = (records, field, value) => records.filter(record => record[field] && record[field].toLocaleLowerCase().includes(value.toLocaleLowerCase()));
const where = (records, field, value) => records.filter(record => record[field] && record[field].toLocaleLowerCase() === value.toLocaleLowerCase());
const find = (records, field, value) => records.find(record => record[field] === value);
const findIndex = (records, field, value) => records.findIndex(record => record[field] === value);

const insert = (table, record) => db[table].push(record);
const update = (table, record, field, value) => db[table].splice(findIndex(db[table], field, value), 1, record);
const remove = (table, field, value) => db[table].splice(findIndex(db[table], field, value), 1);

const removeDuplicates = records => records.filter((record, index, self) =>
  index === self.findIndex(r => (
    r.place === record.place && r.id === record.id
  ))
);

const dateOptions = {
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
  hour12: false
};
const currencyDate = () => new Intl.DateTimeFormat('pt-BR', dateOptions).format(new Date());

const responseMsg = (code, message, detailedMessage) => ({ code, message, detailedMessage });
const errorGetNotFound = (resource) => responseMsg(404, `${resource} not found.`, `${resource} not found in database.`);
const errorDeleteNotFound = (resource) => responseMsg(400, `${resource} not found.`, `${resource} not found in database.`);

const log = msg => console.log(`${currencyDate()}:`, msg);

initDB();

module.exports  = function(app) {
  app.get(`${urlApiBase}/reload`, (req, res) => {
    log('RELOAD DB');

    console.log(db);

    initDB();

    console.log(db);

    res.sendStatus(200);
  })

  app.get(`${urlApiBase}`, (req, res) => {
    log(`GET ${req.url}`); log(req.query);

    const page = +req.query.page || 1;
    const pageSize = +req.query.pageSize || 10;

    const start = startPage(page, pageSize);
    const end = endPage(page, pageSize);

    let records = select('people');

    if (req.query.search) {
      records = [
        ...like(records, 'name', req.query.search),
        ...like(records, 'nickname', req.query.search),
        ...like(records, 'email', req.query.search),
        ...like(records, 'city', req.query.search),
        ...where(records, 'genre', req.query.search)
      ];

      records = removeDuplicates(records);
    }

    if (req.query.name) { records = like(records, 'name', req.query.name); }
    if (req.query.nickname) { records = like(records, 'nickname', req.query.nickname); }
    if (req.query.email) { records = like(records, 'email', req.query.email); }
    if (req.query.city) { records = like(records, 'city', req.query.city); }
    if (req.query.genre) { records = where(records, 'genre', req.query.genre); }

    if (req.query.status) {
      let recordsWithStatus = [];

      req.query.status.split(',').forEach(status => {
        recordsWithStatus = [...recordsWithStatus, ...where(records, 'status', status)]
      });

      records = recordsWithStatus;
    }

    const hasNext = records.length > end;

    records = [... records.slice(start, end)];

    records = records.map(person => ({
      id: person.id,
      name: person.name,
      birthdate: person.birthdate,
      genre: person.genre,
      city: person.city,
      status: person.status,
      nickname: person.nickname,
      email: person.email}));

    res.send({
      hasNext: hasNext,
      items: records
    });
  });

  app.get(`${urlApiBase}/:id`, (req, res) => {
    log(`GET ${req.url}`); log(req.params);

    const people = select('people');
    const person = find(people, 'id', req.params.id);

    if (person) {
      res.send(person);
    } else {
      res.status(404).send(errorGetNotFound(`Person`));
    }
  });

  app.post(`${urlApiBase}`, (req, res) => {
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
      const errorMsg = responseMsg(400, 'Bad Request.', 'Invalid resource.');

      errorMsg.details = [];

      errors.forEach(error => errorMsg.details.push(responseMsg('0001', error, error)));

      res.status(400).send(errorMsg);
      return;
    }

    if (!(person.dependents instanceof Array)) {
      person.dependents = [];
    }

    insert('people', person);

    res.status(201).send(person);
  });

  app.put(`${urlApiBase}/:id`, (req, res) => {
    log(`PUT ${req.url}`); log(req.params); log(req.body);

    const people = select('people');
    const person = find(people, 'id', req.params.id);

    if (!person) {
      res.status(404).send(errorGetNotFound(`Person`));
      return;
    }

    const errors = [];
    const personUpdated = req.body || {};

    if (person.name !== personUpdated.name) { errors.push('Name cannot be updated.'); }
    if (person.email !== personUpdated.email) { errors.push('E-mail cannot be updated.'); }
    if (person.status !== personUpdated.status) { errors.push('Status cannot be updated.'); }
    if (person.status !== 'Active') { errors.push('Customer inactive cannot be updated.'); }

    if (errors.length > 0) {
      const errorMsg = responseMsg(400, 'Bad Request.', 'Invalid resource.');

      errorMsg.details = [];

      errors.forEach(error => errorMsg.details.push(responseMsg('0001', error, error)));

      res.status(400).send(errorMsg);
      return;
    }

    if (!(person.dependents instanceof Array)) {
      person.dependents = [];
    }

    update('people', personUpdated, 'id', req.params.id);

    res.status(201).send(person);
  });

  app.delete(`${urlApiBase}`, (req, res) => {
    log(`DELETE ALL ${req.url}`); log(req.body);

    const people = select('people');
    let deletePeople = 0;

    req.body.forEach(person => {
      const index = findIndex(people, 'id', person.id);

      if (index > -1) {
        people.splice(index, 1);
        remove('people', 'id', index);
        deletePeople++;
      }
    });

    log(`Records deleted: ${deletePeople}`);

    if (deletePeople > 0) {
      res.sendStatus(204);
    } else {
      res.status(400).send(errorDeleteNotFound(`People`));
    }
  });

  app.delete(`${urlApiBase}/:id`, (req, res) => {
    log(`DELETE ${req.url}`); log(req.params);

    const people = select('people');
    const person = find(people, 'id', req.params.id);

    if (!person) {
      res.status(404).send(errorGetNotFound(`Person`));
      return;
    }

    remove('people', 'id', req.params.id);

    res.status(204).send(person);
  });

  app.all('/*', function(req, res) {
    log(`* ${req.url}`); log(req.params); log(req.query); log(req.body);

    res.status(400).send(responseMsg(400, 'Bad Request.', 'Invalid endpoint.'));
  });
};
