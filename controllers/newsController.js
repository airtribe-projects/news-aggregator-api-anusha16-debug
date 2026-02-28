const axios = require('axios');
const users = require('../models/userModel');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://gnews.io/api/v4';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

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

module.exports = {
    getNews,
    searchNews,
    clearCache
};
