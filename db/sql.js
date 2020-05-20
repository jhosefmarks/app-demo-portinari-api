const database = require('./db');

let db;

const initDB = () => db = JSON.parse(JSON.stringify(database));

const clone = obj => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch(err) {
    return undefined;
  }
};

const select = table => clone(db[table]);
const like = (records, field, value) => clone(records.filter(record => record[field] && record[field].toLocaleLowerCase().includes(value.toLocaleLowerCase())));
const where = (records, field, value) => clone(records.filter(record => record[field] && record[field].toLocaleLowerCase() === value.toLocaleLowerCase()));
const find = (records, field, value) => clone(records.find(record => record[field] === value));
const findIndex = (records, field, value) => records.findIndex(record => record[field] === value);

const order = (table, field, desc = false) => table.sort((a, b) => (a[field] === b[field] ? 0 : a[field] > b[field] ? 1 : -1) * (desc ? -1 : 1));
const orderby = (table, field) => {
  let desc = false;

  if (field[0] === '-') {
    field = field.substr(1);
    desc = true;
  }

  return order(table, field, desc);
};

const insert = (table, record) => db[table].push(clone(record));
const update = (table, record, field, value) => db[table].splice(findIndex(db[table], field, value), 1, clone(record));
const remove = (table, field, value) => db[table].splice(findIndex(db[table], field, value), 1);

initDB();

module.exports = {
  initDB,
  select,
  like,
  where,
  find,
  findIndex,
  orderby,
  insert,
  update,
  remove
};
