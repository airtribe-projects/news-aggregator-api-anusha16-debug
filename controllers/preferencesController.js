const users = require('../models/userModel');

// Set/Update user preferences
const setPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;
        
        // Find user
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user preferences
        user.preferences = preferences;
        user.updatedAt = new Date().toISOString();
        
        res.status(200).json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });
    } catch (error) {
        console.error('Error in setPreferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user preferences
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            preferences: user.preferences || []
        });
    } catch (error) {
        console.error('Error in getPreferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    setPreferences,
    getPreferences
};
