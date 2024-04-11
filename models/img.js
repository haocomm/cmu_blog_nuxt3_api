'use strict'
const fs = require('fs')
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Img extends Model {
    static associate (models) {
    }
  };
  Img.init({
    url: DataTypes.STRING,
    path: DataTypes.STRING
  }, {
    hooks: {
      beforeDestroy: (model, options) => {
        if (fs.existsSync(model.path)) {
          fs.unlink(model.path, (err) => {
            if (err) {
              console.error(err)
            }
          })
        }
      }
    },
    sequelize,
    underscored: true,
    tableName: 'imgs',
    modelName: 'Img'
  })
  Img.inputSchema = {
    url: 'required',
    path: 'required'
  }
  Img.beforeBulkDestroy(function (options) {
    options.individualHooks = true
    return options
  })
  return Img
}
