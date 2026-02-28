const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/authRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const newsRoutes = require('./routes/newsRoutes');

// Import news controller for background updates
const { startPeriodicCacheUpdates } = require('./controllers/newsController');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', authRoutes);
app.use('/users/preferences', preferencesRoutes);
app.use('/news', newsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'News Aggregator API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            preferences: '/api/v1/preferences',
            news: '/api/v1/news'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Only listen if not in test mode
if (require.main === module) {
    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
        
        // Start periodic cache updates
        startPeriodicCacheUpdates();
    });
}

module.exports = app;