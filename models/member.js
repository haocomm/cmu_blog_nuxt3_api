"use strict";
const { Model } = require("sequelize");
const crypto = require("crypto");
const bcryptjs = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class Member extends Model {
    static associate(models) {
      this.hasMany(models.MemberAccessToken, {
        foreignKey: "member_id",
      });
      this.hasMany(models.AuthClient, {
        foreignKey: "member_id",
      });
    }
  }
  Member.init(
    {
      firstname: DataTypes.STRING,
      lastname: DataTypes.STRING,
      phone: DataTypes.STRING,
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
      },
      password: DataTypes.STRING,
      salt: DataTypes.STRING,
      refresh_token: DataTypes.STRING,
      refresh_token_expire_at: DataTypes.DATE,
      avatar: DataTypes.STRING,
      verify_token: DataTypes.STRING,
      verify_at: DataTypes.DATE,
      password_reset_token: DataTypes.STRING,
      password_reset_expire_at: DataTypes.DATE,
      password_created_at: {
        type: DataTypes.DATE,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      hooks: {
        beforeCreate: (member, options) => {
          const salt = bcryptjs.genSaltSync(10);
          member.salt = salt;
          member.password = bcryptjs.hashSync(member.password, salt);
          member.verify_token = crypto.randomBytes(16).toString("hex");
        },
      },
      sequelize,
      underscored: true,
      tableName: "members",
      modelName: "Member",
    }
  );
  Member.inputSchema = {
    email: "required",
    password: "required",
  };
  Member.prototype.validPassword = function (password) {
    return bcryptjs.compareSync(password, this.password);
  };
  Member.prototype.validAuthToken = function (authToken) {
    return this.auth_token === authToken;
  };
  return Member;
};
