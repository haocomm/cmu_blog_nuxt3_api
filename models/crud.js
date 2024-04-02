"use strict";
const fs = require("fs");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Crud extends Model {
    static associate(models) {}
  }
  Crud.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      timestamps: false,
      tableName: "cruds",
      modelName: "Crud",
    }
  );
  return Crud;
};
