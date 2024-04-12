const express = require('express')
const { authController } = require('../controllers')

const passport = require('../config/passport')
const { checkBody, checkParamToken } = require('../middlewares')

const router = express.Router()

const path = '/auth'

router.post(`${path}/login`, passport.authenticate('local', { session: false }), authController.login)
router.get(`${path}/me`, passport.authenticate('bearer', { session: false }), authController.me)
router.post(`${path}/token`, checkBody, authController.token)
router.delete(`${path}/logout`, passport.authenticate('bearer-logout', { session: false }), authController.logout)

router.post(`${path}/update-profile`, passport.authenticate('bearer', { session: false }), checkBody, authController.updateProfile)
router.post(`${path}/update-password`, passport.authenticate('bearer', { session: false }), checkBody, authController.updatePassword)

router.post(`${path}/forgot-password`, checkBody, authController.forgotPassword)
router.post(`${path}/check-password-token`, checkBody, authController.checkPasswordToken)
router.put(`${path}/reset-password/:token`, checkParamToken, checkBody, authController.resetPassword)

module.exports = router
