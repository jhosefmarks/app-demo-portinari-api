const http = require('http');
const app = require('./config/express');
const PORT = process.env.PORT || 5000;

http.createServer(app).listen(PORT, function() {
  console.log('Server listening on port: ' + this.address().port);
});
