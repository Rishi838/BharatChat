// Importing required modules

const express = require('express')
const router = express.Router()
const mainController = require('../controllers/mainController')

// Route to update access token

router.post("/update-access-token",mainController.UpdateToken)

module.exports = router