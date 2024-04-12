const express = require("express");
const { authMemberController } = require("../controllers");

const passport = require("../config/passport");
const upload = require("../config/multer");
const { checkBody, checkParamToken, checkParamKey } = require("../middlewares");

const router = express.Router();

const path = "/auth-member";

router.post(`${path}/signup`, checkBody, authMemberController.signup);
router.post(
  `${path}/resend-verify`,
  checkBody,
  authMemberController.resendVerify
);
router.post(`${path}/verify`, checkBody, authMemberController.verify);

router.post(
  `${path}/forgot-password`,
  checkBody,
  authMemberController.forgotPassword
);
router.post(
  `${path}/check-password-token`,
  checkBody,
  authMemberController.checkPasswordToken
);
router.put(
  `${path}/reset-password/:token`,
  checkParamToken,
  checkBody,
  authMemberController.resetPassword
);

router.get(`${path}/oauth/:key`, checkParamKey, authMemberController.oauth);
router.get(`${path}/callback`, authMemberController.callback);

router.post(
  `${path}/login`,
  passport.authenticate("local-member", { session: false }),
  authMemberController.login
);

router.get(
  `${path}/me`,
  passport.authenticate("bearer-member", { session: false }),
  authMemberController.me
);
router.post(
  `${path}/update-profile`,
  passport.authenticate("bearer-member", { session: false }),
  checkBody,
  authMemberController.updateProfile
);
router.post(
  `${path}/update-password`,
  passport.authenticate("bearer-member", { session: false }),
  checkBody,
  authMemberController.updatePassword
);
router.post(
  `${path}/update-avatar`,
  passport.authenticate("bearer-member", { session: false }),
  upload.single("avatar_img"),
  authMemberController.updateAvatar
);
router.post(`${path}/token`, checkBody, authMemberController.token);

router.delete(
  `${path}/logout`,
  passport.authenticate("bearer-member-logout", { session: false }),
  authMemberController.logout
);

module.exports = router;
