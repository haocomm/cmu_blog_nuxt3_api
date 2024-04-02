const express = require("express");
const { crudController } = require("../controllers");

const { checkBody, checkParamId } = require("../middlewares");

const router = express.Router();

const path = "/cruds";

router.get(`${path}/`, crudController.index);
router.get(`${path}/:id`, checkParamId, crudController.show);
router.post(
  `${path}/`,
  checkBody,
  crudController.inputValidate,
  crudController.store
);
router.put(
  `${path}/:id`,
  checkParamId,
  checkBody,
  crudController.inputValidate,
  crudController.update
);
router.delete(`${path}/:id`, checkParamId, crudController.destroy);

module.exports = router;
