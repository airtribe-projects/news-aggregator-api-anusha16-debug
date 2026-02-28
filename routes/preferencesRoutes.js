const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferencesController');
const authMiddleware = require('../middleware/authMiddleware');

// All preferences routes require authentication
router.use(authMiddleware);

// Get user preferences
router.get('/', preferencesController.getPreferences);

// Set/Update user preferences
router.put('/', preferencesController.setPreferences);

module.exports = router;
