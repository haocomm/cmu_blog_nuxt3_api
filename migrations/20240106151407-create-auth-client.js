"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .createTable("auth_clients", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        member_id: {
          type: Sequelize.INTEGER,
        },
        auth_client: {
          type: Sequelize.STRING,
        },
        auth_key: {
          type: Sequelize.STRING,
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
      .then(() => queryInterface.addIndex("auth_clients", ["member_id"]));
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("auth_clients");
  },
};
