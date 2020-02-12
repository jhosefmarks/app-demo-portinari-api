const database = require('./db');

let db;

const initDB = () => db = JSON.parse(JSON.stringify(database));

const select = table => db[table];
const like = (records, field, value) => records.filter(record => record[field] && record[field].toLocaleLowerCase().includes(value.toLocaleLowerCase()));
const where = (records, field, value) => records.filter(record => record[field] && record[field].toLocaleLowerCase() === value.toLocaleLowerCase());
const find = (records, field, value) => records.find(record => record[field] === value);
const findIndex = (records, field, value) => records.findIndex(record => record[field] === value);

const insert = (table, record) => db[table].push(record);
const update = (table, record, field, value) => db[table].splice(findIndex(db[table], field, value), 1, record);
const remove = (table, field, value) => db[table].splice(findIndex(db[table], field, value), 1);

initDB();

module.exports = {
  initDB,
  select,
  like,
  where,
  find,
  findIndex,
  insert,
  update,
  remove
};
