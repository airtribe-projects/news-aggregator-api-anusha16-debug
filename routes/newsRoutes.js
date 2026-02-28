const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');

// All news routes require authentication
router.use(authMiddleware);

// Get news based on user preferences
router.get('/', newsController.getNews);

// Search news articles
router.get('/search', newsController.searchNews);

// Clear cache (optional utility endpoint)
router.post('/clear-cache', newsController.clearCache);

module.exports = router;
