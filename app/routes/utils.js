const urlApiBase = '/api/samples/v1';

const startPage = (page = 1, pageSize = 10) => (page - 1) * pageSize;
const endPage = (page, pageSize) => startPage(page, pageSize) + pageSize;

const removeDuplicates = (records, key) => records.filter((record, index, self) =>
  index === self.findIndex(r => (
    r[key || 'id'] === record[key || 'id']
  ))
);

const responseMsg = (code, message, detailedMessage) => ({ code, message, detailedMessage });
const errorGetNotFound = (resource) => responseMsg(404, `${resource} not found.`, `${resource} not found in database.`);
const errorDeleteNotFound = (resource) => responseMsg(400, `${resource} not found.`, `${resource} not found in database.`);

module.exports = {
  urlApiBase,
  startPage,
  endPage,
  removeDuplicates,
  responseMsg,
  errorGetNotFound,
  errorDeleteNotFound
}
