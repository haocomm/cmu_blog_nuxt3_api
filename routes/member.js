const express = require('express')
const { memberController } = require('../controllers')

const passport = require('../config/passport')
const { checkBody, checkParamId } = require('../middlewares')

const router = express.Router()

const path = '/members'

router.get(`${path}/`, passport.authenticate('bearer', { session: false }), memberController.index)
router.get(`${path}/:id`, passport.authenticate('bearer', { session: false }), checkParamId, memberController.show)
router.post(`${path}-check`, checkBody, memberController.check)
router.post(`${path}/`, passport.authenticate('bearer', { session: false }), checkBody, memberController.store)
router.put(`${path}/:id`, passport.authenticate('bearer', { session: false }), checkParamId, checkBody, memberController.update)
router.delete(`${path}/:id`, passport.authenticate('bearer', { session: false }), checkParamId, memberController.destroy)

module.exports = router
