const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');

// Register a new user
router.post('/signup', validateRegistration, authController.register);

// Login user
router.post('/login', validateLogin, authController.login);



module.exports = router;
