"use strict";
const dayjs = require("dayjs");
const db = require("../models");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await db.User.create({
      firstname: "Admin",
      lastname: "Admin",
      email: process.env.ADMIN_DEV_EMAIL,
      password: process.env.ADMIN_DEV_PASSWORD,
      role: "admin",
    });
    await db.Member.create({
      firstname: "Test",
      lastname: "Test",
      verify_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      email: process.env.MEMBER_DEV_EMAIL,
      password: process.env.MEMBER_DEV_PASSWORD,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null);
    await queryInterface.bulkDelete("members", null);
  },
};
