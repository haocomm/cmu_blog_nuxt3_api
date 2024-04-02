'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    static associate(models) {}
  }
  Image.init(
    {
      filename: DataTypes.STRING,
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      underscored: true,
      tableName: 'images',
      modelName: 'Image',
    }
  );
  return Image;
};
