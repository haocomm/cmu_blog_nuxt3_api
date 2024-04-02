const express = require('express')
const { userController } = require('../controllers')

const passport = require('../config/passport')
const { checkBody, checkParamId, checkParamUsername } = require('../middlewares')

const router = express.Router()

const path = '/users'

router.get(`${path}/`, passport.authenticate('bearer', { session: false }), userController.index)
router.get(`${path}/:username`, passport.authenticate('bearer', { session: false }), checkParamUsername, userController.show)
router.post(`${path}-check`, passport.authenticate('bearer', { session: false }), checkBody, userController.check)
router.post(`${path}/`, passport.authenticate('bearer', { session: false }), checkBody, userController.store)
router.put(`${path}/:id`, passport.authenticate('bearer', { session: false }), checkParamId, checkBody, userController.update)
router.delete(`${path}/:id`, passport.authenticate('bearer', { session: false }), checkParamId, userController.destroy)

module.exports = router
