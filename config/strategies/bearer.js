const BearerStrategy = require('passport-http-bearer').Strategy;
const dayjs = require('dayjs');
const db = require('../../models');
const Op = db.Sequelize.Op;
const AccessToken = db.AccessToken;
const User = db.User;

module.exports = new BearerStrategy(async (token, done) => {
  try {
    const access = await AccessToken.findOne({
      where: {
        access_token: token,
        expire_at: {
          [Op.gte]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      include: {
        model: User,
      },
    });
    if (access) {
      return done(null, access.User);
    }
  } catch (e) {
    console.log(e);
  }
  return done(null, false);
});
