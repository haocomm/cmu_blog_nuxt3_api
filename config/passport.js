const passport = require('passport');
const bearer = require('./strategies/bearer');
const bearerLogout = require('./strategies/bearerLogout');
const local = require('./strategies/local');
const bearerMember = require('./strategies/bearerMember');
const bearerMemberLogout = require('./strategies/bearerMemberLogout');
const localMember = require('./strategies/localMember');

passport.use(local);
passport.use(bearer);
passport.use('bearer-logout', bearerLogout);

passport.use('local-member', localMember);
passport.use('bearer-member', bearerMember);
passport.use('bearer-member-logout', bearerMemberLogout);

module.exports = passport;
