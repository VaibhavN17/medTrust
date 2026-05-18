const serverless = require('serverless-http');
const app = require('./src/server');

module.exports = app;
module.exports.handler = serverless(app);
