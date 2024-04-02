const BearerStrategy = require('passport-http-bearer').Strategy;
const dayjs = require('dayjs');
const db = require('../../models');
const Op = db.Sequelize.Op;
const MemberAccessToken = db.MemberAccessToken;
const Member = db.Member;

module.exports = new BearerStrategy(async (token, done) => {
  try {
    const access = await MemberAccessToken.findOne({
      where: {
        access_token: token,
        expire_at: {
          [Op.gte]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      include: {
        model: Member,
        attributes: {
          exclude: [
            'password',
            'salt',
            'password_reset_expire_at',
            'password_reset_token',
            'active',
            'facebook_id',
            'google_id',
            'refresh_token',
            'refresh_token_expire_at',
            'updatedAt',
            'verify_at',
            'verify_token',
          ],
        },
      },
    });
    if (access) {
      return done(null, access.Member);
    }
  } catch (e) {
    console.log(e);
  }
  return done(null, false);
});
