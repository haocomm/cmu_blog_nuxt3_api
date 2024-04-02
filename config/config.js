require('dotenv').config()
module.exports = {
  development: {
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    host: process.env.DBHOST,
    dialect: process.env.DBTYPE,
    logging: false,
    timezone: '+07:00'
  },
  test: {
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    host: process.env.DBHOST,
    dialect: process.env.DBTYPE,
    logging: true,
    timezone: '+07:00'
  },
  production: {
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    host: process.env.DBHOST,
    dialect: process.env.DBTYPE,
    logging: false,
    timezone: '+07:00'
  }
}
