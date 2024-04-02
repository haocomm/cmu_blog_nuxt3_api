'use strict'
const { faker } = require('@faker-js/faker');
const db = require('../models')
const dayjs = require('dayjs')

const userCreate = 'kunakorn.k'
const postTypes = ['general', 'sport', 'technology', 'entertainment', 'lifestyle', 'other']

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // const user = await db.User.findOne({
    //   where: {
    //     account_name: userCreate
    //   }
    // })
    // if (user) {
    //   const posts = [...Array(100)].map((post) => (
    //     {
    //       title: faker.lorem.sentence(),
    //       content: faker.lorem.paragraphs(),
    //       type: postTypes[Math.floor(Math.random() * postTypes.length)],
    //       user_id: user.id,
    //       created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    //       updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
    //     }
    //   ))
    //   await queryInterface.bulkInsert('posts', posts)
    // } else {
    //   console.log(`No user ${userCreate} for create Posts`)
    // }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('posts', null)
  }
}
