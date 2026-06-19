const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Registration route
router.post('/register', authController.register);

module.exports = router;