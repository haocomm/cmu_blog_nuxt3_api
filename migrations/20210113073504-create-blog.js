"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .createTable("blogs", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        title: {
          type: Sequelize.STRING,
        },
        slug: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        content: {
          type: Sequelize.TEXT("long"),
        },
        tags: {
          type: Sequelize.TEXT,
        },
        hit: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        img_id: {
          type: Sequelize.INTEGER,
        },
        member_id: {
          type: Sequelize.INTEGER,
        },
        createdAt: {
          allowNull: false,
          field: "created_at",
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          field: "updated_at",
          type: Sequelize.DATE,
        },
      })
      .then(() => queryInterface.addIndex("blogs", ["img_id"]))
      .then(() => queryInterface.addIndex("blogs", ["member_id"]));
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("blogs");
  },
};
