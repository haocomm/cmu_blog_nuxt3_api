"use strict";
const { faker } = require("@faker-js/faker");
const db = require("../models");
const slugify = require("slugify");
const _ = require("lodash");
const dayjs = require("dayjs");

const postTypes = [
  "general",
  "sport",
  "technology",
  "entertainment",
  "lifestyle",
  "other",
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cruds = [...Array(30)].map(() => ({
      name: faker.lorem.words(1),
    }));
    await queryInterface.bulkInsert("cruds", cruds);
    const member = await db.Member.findOne({
      where: {
        email: process.env.MEMBER_DEV_EMAIL,
      },
    });
    if (member) {
      const blogs = [...Array(20)].map(() => {
        const title = faker.lorem.sentence();
        return {
          title,
          slug: slugify(title),
          content: faker.lorem.paragraphs(),
          tags: _.shuffle(postTypes)
            .slice(0, _.random(1, postTypes.length))
            .join(","),
          member_id: member.id,
          created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        };
      });
      await queryInterface.bulkInsert("blogs", blogs);
    } else {
      console.log(`No member for create Posts`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("blogs", null);
    await queryInterface.bulkDelete("cruds", null);
  },
};
