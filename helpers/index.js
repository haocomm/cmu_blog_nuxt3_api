const fs = require('fs')
const path = require('path')
const basename = path.basename(__filename)

const helpers = {}

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach((file) => {
    const helper = require(path.join(__dirname, file))
    helpers[file.slice(0, -3)] = helper
  })

module.exports = helpers
