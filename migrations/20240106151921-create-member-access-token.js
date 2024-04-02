'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .createTable('member_access_tokens', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        member_id: {
          type: Sequelize.INTEGER,
        },
        access_token: {
          type: Sequelize.STRING,
        },
        ip: {
          type: Sequelize.STRING,
        },
        expire_at: {
          type: Sequelize.DATE,
        },
        createdAt: {
          allowNull: false,
          field: 'created_at',
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          field: 'updated_at',
          type: Sequelize.DATE,
        },
      })
      .then(() => queryInterface.addIndex('member_access_tokens', ['member_id']))
      .then(() => queryInterface.addIndex('member_access_tokens', ['access_token']));
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('member_access_tokens');
  },
};
