module.exports = {
  logger: require('./utils/logger'),
  HttpClient: require('./utils/httpclient'),
  ...require('./middleware/errorHandler'),
  ...require('./middleware/validator')
};