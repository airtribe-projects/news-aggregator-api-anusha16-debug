const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');

// All news routes require authentication
router.use(authMiddleware);

// Get news based on user preferences
router.get('/', newsController.getNews);

// Search news articles (query params)
router.get('/search', newsController.searchNews);

// Get all read articles
router.get('/read', newsController.getReadArticles);

// Get all favorite articles
router.get('/favorites', newsController.getFavoriteArticles);

// Search by keyword (path param)
router.get('/search/:keyword', newsController.searchByKeyword);

// Mark article as read
router.post('/:id/read', newsController.markAsRead);

// Mark article as favorite
router.post('/:id/favorite', newsController.markAsFavorite);

// Clear cache (utility endpoint)
router.post('/clear-cache', newsController.clearCache);

module.exports = router;
