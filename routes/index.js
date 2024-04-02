const fs = require('fs')
const path = require('path')
const basename = path.basename(__filename)

const routes = []

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach((file) => {
    const route = require(path.join(__dirname, file.slice(0, -3)))
    routes.push(route)
  })

module.exports = routes
