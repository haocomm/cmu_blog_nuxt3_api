"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AuthClient extends Model {
    static associate(models) {
      this.belongsTo(models.Member, {
        foreignKey: "member_id",
      });
    }
  }
  AuthClient.init(
    {
      member_id: DataTypes.INTEGER,
      auth_client: DataTypes.STRING,
      auth_key: DataTypes.STRING,
    },
    {
      sequelize,
      underscored: true,
      tableName: "auth_clients",
      modelName: "AuthClient",
    }
  );
  return AuthClient;
};
