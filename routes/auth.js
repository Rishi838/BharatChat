const express = require('express')
const cookieParser = require('cookie-parser')
const router = express.Router()
const authController = require('../controllers/authController')
const middleware = require('../utilities/middleware')

// Using Cookie parser to parse cookies
router.use(cookieParser())

// Authentication Routes
router.post('/signup',authController.signup)
router.post('/login',authController.login)
router.get('/verify',authController.verify)
// Validate_app should only be used from the android app, web browser will have security concerns
router.post('/validate_app',authController.validate)
// Logout Api should be called only from the web browser, because logging out from  android application is simple
router.post('/logout',authController.logout)
router.post('/resend',authController.resend)

module.exports = router