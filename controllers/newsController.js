const axios = require('axios');
const users = require('../models/userModel');
const { readArticles, favoriteArticles } = require('../models/articleModel');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://gnews.io/api/v4';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Background cache update interval (every 10 minutes)
const CACHE_UPDATE_INTERVAL = 10 * 60 * 1000;

// Function to update cache in background
const updateCacheInBackground = async () => {
    try {
        console.log('[Background Update] Starting cache refresh...');
        
        // Get all users with preferences
        const usersWithPreferences = users.filter(u => u.preferences && u.preferences.length > 0);
        
        for (const user of usersWithPreferences) {
            const cacheKey = `news_${user.id}_${JSON.stringify(user.preferences)}`;
            
            // Skip if recently updated
            if (cache.has(cacheKey)) {
                const cachedData = cache.get(cacheKey);
                if (Date.now() - cachedData.timestamp < CACHE_UPDATE_INTERVAL) {
                    continue;
                }
            }
            
            if (!NEWS_API_KEY) continue;
            
            try {
                const searchQuery = user.preferences.join(' OR ');
                const params = {
                    apikey: NEWS_API_KEY,
                    q: searchQuery,
                    max: 20,
                    lang: 'en'
                };
                
                const response = await axios.get(`${NEWS_API_BASE_URL}/search`, {
                    params,
                    timeout: 10000
                });
                
                const articles = response.data.articles || [];
                
                cache.set(cacheKey, {
                    articles,
                    timestamp: Date.now()
                });
                
                console.log(`[Background Update] Cache updated for user ${user.id}`);
            } catch (error) {
                console.error(`[Background Update] Error updating cache for user ${user.id}:`, error.message);
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('[Background Update] Cache refresh completed');
    } catch (error) {
        console.error('[Background Update] Error:', error.message);
    }
};

// Start periodic cache updates
let backgroundUpdateTimer = null;
const startPeriodicCacheUpdates = () => {
    if (backgroundUpdateTimer) return; // Already running
    
    console.log('[Background Update] Starting periodic cache updates...');
    backgroundUpdateTimer = setInterval(updateCacheInBackground, CACHE_UPDATE_INTERVAL);
    
    // Run immediately on startup
    setTimeout(updateCacheInBackground, 5000); // Wait 5 seconds after server start
};

// Stop periodic updates (useful for testing)
const stopPeriodicCacheUpdates = () => {
    if (backgroundUpdateTimer) {
        clearInterval(backgroundUpdateTimer);
        backgroundUpdateTimer = null;
        console.log('[Background Update] Stopped periodic cache updates');
    }
};

// Get news based on user preferences
const getNews = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const preferences = user.preferences || [];
        
        if (!preferences || preferences.length === 0) {
            return res.status(400).json({ 
                error: 'Please set your news preferences first' 
            });
        }
        
        // Check if NEWS_API_KEY is configured
        if (!NEWS_API_KEY) {
            // Return mock news if API key is not configured
            return res.status(200).json({
                news: [
                    {
                        title: 'Mock News Article',
                        description: 'This is a mock news article',
                        url: 'https://example.com',
                        source: 'Mock Source'
                    }
                ]
            });
        }
        
        // Create cache key based on preferences
        const cacheKey = `news_${userId}_${JSON.stringify(preferences)}`;
        
        // Check cache
        if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
                return res.status(200).json({
                    news: cachedData.articles
                });
            }
        }
        
        // Build query parameters - use preferences as search terms
        const searchQuery = preferences.join(' OR ');
        
        const params = {
            apikey: NEWS_API_KEY,
            q: searchQuery,
            max: 20,
            lang: 'en'
        };
        
        // Fetch news from external API
        const response = await axios.get(`${NEWS_API_BASE_URL}/search`, {
            params,
            timeout: 10000 // 10 seconds timeout
        });
        
        const articles = response.data.articles || [];
        
        // Cache the results
        cache.set(cacheKey, {
            articles,
            timestamp: Date.now()
        });
        
        res.status(200).json({
            news: articles
        });
        
    } catch (error) {
        console.error('Error in getNews:', error.message);
        
        if (error.response) {
            // External API error - return mock data
            return res.status(200).json({
                news: [
                    {
                        title: 'Mock News Article',
                        description: 'This is a mock news article',
                        url: 'https://example.com',
                        source: 'Mock Source'
                    }
                ]
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'Request timeout while fetching news' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Search news articles
const searchNews = async (req, res) => {
    try {
        const { query, from, to, sortBy } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        if (!NEWS_API_KEY) {
            return res.status(503).json({ 
                error: 'News API is not configured. Please set NEWS_API_KEY in .env file' 
            });
        }
        
        // Create cache key
        const cacheKey = `search_${query}_${from || ''}_${to || ''}_${sortBy || ''}`;
        
        // Check cache
        if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
                return res.status(200).json({
                    message: 'Search results fetched successfully (from cache)',
                    source: 'cache',
                    articles: cachedData.articles,
                    totalResults: cachedData.articles.length
                });
            }
        }
        
        const params = {
            apikey: NEWS_API_KEY,
            q: query,
            max: 20,
            lang: 'en'
        };
        
        const response = await axios.get(`${NEWS_API_BASE_URL}/search`, {
            params,
            timeout: 10000
        });
        
        const articles = response.data.articles || [];
        
        // Cache the results
        cache.set(cacheKey, {
            articles,
            timestamp: Date.now()
        });
        
        res.status(200).json({
            message: 'Search results fetched successfully',
            source: 'api',
            query,
            articles,
            totalResults: articles.length
        });
        
    } catch (error) {
        console.error('Error in searchNews:', error.message);
        
        if (error.response) {
            return res.status(502).json({ 
                error: 'Failed to search news from external API',
                details: error.response.data?.message || error.message
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'Request timeout while searching news' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Clear cache (optional utility endpoint)
const clearCache = (req, res) => {
    cache.clear();
    res.status(200).json({ message: 'Cache cleared successfully' });
};

// Search news by keyword
const searchByKeyword = async (req, res) => {
    try {
        const { keyword } = req.params;
        
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword is required' });
        }
        
        // Create cache key
        const cacheKey = `search_keyword_${keyword}`;
        
        // Check cache using async/await
        const getCachedData = async () => {
            return new Promise((resolve) => {
                if (cache.has(cacheKey)) {
                    const cachedData = cache.get(cacheKey);
                    if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
                        resolve(cachedData);
                    }
                }
                resolve(null);
            });
        };
        
        const cachedData = await getCachedData();
        if (cachedData) {
            return res.status(200).json({
                message: 'Search results from cache',
                source: 'cache',
                keyword,
                articles: cachedData.articles,
                totalResults: cachedData.articles.length
            });
        }
        
        if (!NEWS_API_KEY) {
            return res.status(200).json({
                message: 'Mock search results',
                keyword,
                articles: [
                    {
                        id: 'mock-1',
                        title: `Mock article about ${keyword}`,
                        description: `This is a mock article related to ${keyword}`,
                        url: 'https://example.com',
                        source: { name: 'Mock Source' }
                    }
                ],
                totalResults: 1
            });
        }
        
        const params = {
            apikey: NEWS_API_KEY,
            q: keyword,
            max: 20,
            lang: 'en'
        };
        
        const response = await axios.get(`${NEWS_API_BASE_URL}/search`, {
            params,
            timeout: 10000
        });
        
        const articles = response.data.articles || [];
        
        // Update cache using async/await
        await new Promise((resolve) => {
            cache.set(cacheKey, {
                articles,
                timestamp: Date.now()
            });
            resolve();
        });
        
        res.status(200).json({
            message: 'Search results fetched successfully',
            source: 'api',
            keyword,
            articles,
            totalResults: articles.length
        });
        
    } catch (error) {
        console.error('Error in searchByKeyword:', error.message);
        
        if (error.response) {
            return res.status(502).json({ 
                error: 'Failed to search news',
                details: error.response.data?.message || error.message
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Mark article as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'Article ID is required' });
        }
        
        // Get or create read articles list for user
        if (!readArticles.has(userId)) {
            readArticles.set(userId, []);
        }
        
        const userReadArticles = readArticles.get(userId);
        
        // Check if already marked as read
        if (userReadArticles.includes(id)) {
            return res.status(200).json({ 
                message: 'Article already marked as read',
                articleId: id
            });
        }
        
        // Add to read list
        userReadArticles.push(id);
        readArticles.set(userId, userReadArticles);
        
        res.status(200).json({ 
            message: 'Article marked as read successfully',
            articleId: id,
            totalRead: userReadArticles.length
        });
        
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Mark article as favorite
const markAsFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, url, source } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Article ID is required' });
        }
        
        if (!title || !url) {
            return res.status(400).json({ 
                error: 'Article title and URL are required' 
            });
        }
        
        // Get or create favorites list for user
        if (!favoriteArticles.has(userId)) {
            favoriteArticles.set(userId, []);
        }
        
        const userFavorites = favoriteArticles.get(userId);
        
        // Check if already favorited
        const existingFavorite = userFavorites.find(article => article.id === id);
        if (existingFavorite) {
            return res.status(200).json({ 
                message: 'Article already in favorites',
                article: existingFavorite
            });
        }
        
        // Add to favorites
        const favoriteArticle = {
            id,
            title,
            description: description || '',
            url,
            source: source || { name: 'Unknown' },
            savedAt: new Date().toISOString()
        };
        
        userFavorites.push(favoriteArticle);
        favoriteArticles.set(userId, userFavorites);
        
        res.status(200).json({ 
            message: 'Article added to favorites successfully',
            article: favoriteArticle,
            totalFavorites: userFavorites.length
        });
        
    } catch (error) {
        console.error('Error in markAsFavorite:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all read articles
const getReadArticles = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userReadArticles = readArticles.get(userId) || [];
        
        res.status(200).json({
            message: 'Read articles retrieved successfully',
            readArticles: userReadArticles,
            totalRead: userReadArticles.length
        });
        
    } catch (error) {
        console.error('Error in getReadArticles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all favorite articles
const getFavoriteArticles = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userFavorites = favoriteArticles.get(userId) || [];
        
        res.status(200).json({
            message: 'Favorite articles retrieved successfully',
            favorites: userFavorites,
            totalFavorites: userFavorites.length
        });
        
    } catch (error) {
        console.error('Error in getFavoriteArticles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getNews,
    searchNews,
    clearCache,
    searchByKeyword,
    markAsRead,
    markAsFavorite,
    getReadArticles,
    getFavoriteArticles,
    startPeriodicCacheUpdates,
    stopPeriodicCacheUpdates
};
