const express = require("express");
const { crudController } = require("../controllers");

const passport = require("../config/passport");
const { checkBody, checkParamId } = require("../middlewares");

const router = express.Router();

const path = "/cruds";

router.get(`${path}/`, passport.authenticate("bearer-member", { session: false }), crudController.index);
router.get(`${path}/:id`, passport.authenticate("bearer-member", { session: false }), checkParamId, crudController.show);
router.post(
  `${path}/`,
  passport.authenticate("bearer-member", { session: false }),
  checkBody,
  crudController.inputValidate,
  crudController.store
);
router.put(
  `${path}/:id`,
  passport.authenticate("bearer-member", { session: false }),
  checkParamId,
  checkBody,
  crudController.inputValidate,
  crudController.update
);
router.delete(`${path}/:id`, passport.authenticate("bearer-member", { session: false }), checkParamId, crudController.destroy);
router.post(`${path}/delete`, passport.authenticate("bearer-member", { session: false }), checkBody, crudController.deletes);

module.exports = router;
