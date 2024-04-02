const passport = require('passport');
const bearer = require('./strategies/bearer');
const local = require('./strategies/local');
const bearerMember = require('./strategies/bearerMember');
const localMember = require('./strategies/localMember');

passport.use(bearer);
passport.use(local);
passport.use('local-member', localMember);
passport.use('bearer-member', bearerMember);

module.exports = passport;
