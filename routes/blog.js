const express = require("express");
const { blogController } = require("../controllers");

const passport = require("../config/passport");
const upload = require("../config/multer");
const { checkBody, checkParamId, checkParamSlug } = require("../middlewares");

const router = express.Router();

const path = "/blogs";

router.get(`${path}/`, blogController.index);
router.get(`${path}/:slug`, checkParamSlug, blogController.show);
router.post(
  `${path}/`,
  passport.authenticate("bearer-member", { session: false }),
  upload.single("blog_img"),
  checkBody,
  blogController.inputValidate,
  blogController.store
);
router.put(
  `${path}/:id`,
  passport.authenticate("bearer-member", { session: false }),
  upload.single("blog_img"),
  checkParamId,
  checkBody,
  blogController.inputValidate,
  blogController.update
);
router.put(
  `${path}/:id/remove-image`,
  passport.authenticate("bearer-member", { session: false }),
  checkParamId,
  checkBody,
  blogController.inputValidate,
  blogController.removeImage
);
router.delete(
  `${path}/:id`,
  passport.authenticate("bearer-member", { session: false }),
  checkParamId,
  blogController.destroy
);

module.exports = router;
