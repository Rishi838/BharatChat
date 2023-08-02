const express = require('express')
const cookieParser = require('cookie-parser')
const router = express.Router()
const authController = require('../controllers/authController')

// Using Cookie parser to parse cookies
router.use(cookieParser())

// Authentication Routes
router.post('/signup',authController.signup)
router.post('/login',authController.login)
router.get('/verify',authController.verify)
// router.post('/logout',authController.logout)

module.exports = router