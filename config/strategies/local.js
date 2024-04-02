const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models').User;

module.exports = new LocalStrategy(async (username, password, done) => {
  const user = await User.findOne({
    where: {
      email: username,
    },
  });
  if (user === null) {
    return done(null, false);
  }
  if (!user.validPassword(password)) {
    return done(null, false);
  }
  return done(null, user);
});
