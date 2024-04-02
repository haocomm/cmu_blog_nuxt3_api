'use strict';
const crypto = require('crypto');
const { Model } = require('sequelize');
const dayjs = require('dayjs');

module.exports = (sequelize, DataTypes) => {
  class AccessToken extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
    }
  }
  AccessToken.init(
    {
      user_id: DataTypes.INTEGER,
      access_token: DataTypes.STRING,
      ip: DataTypes.STRING,
      expire_at: DataTypes.DATE,
    },
    {
      hooks: {
        beforeCreate: (accessToken, options) => {
          accessToken.access_token = crypto.randomBytes(32).toString('hex');
          accessToken.expire_at = dayjs().add(24, 'hour').format('YYYY-MM-DD HH:mm:ss');
        },
      },
      sequelize,
      underscored: true,
      tableName: 'access_tokens',
      modelName: 'AccessToken',
    }
  );
  return AccessToken;
};
