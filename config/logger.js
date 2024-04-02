const path = require('path')
const morgan = require('morgan')
const rfs = require('rotating-file-stream')

morgan.token('date', () => {
  const p = new Date().toString().replace(/[A-Z]{3}\+/, '+').split(/ /)
  return (p[2] + '/' + p[1] + '/' + p[3] + ':' + p[4] + ' ' + p[5])
})

morgan.token('level', (req, res) => {
  return res.statusCode < 400 ? 'info' : 'error'
})

morgan.token('clientaddr', (req, res) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress
})

const accessLogStream = rfs.createStream('access.log', {
  size: '10M',
  maxFiles: 30,
  interval: '1d',
  path: path.join(__dirname, '../logs')
})

module.exports = morgan(':level :clientaddr ::remote-addr  - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms', { stream: accessLogStream })
