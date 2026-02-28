// Validation middleware for user registration
const validateRegistration = (req, res, next) => {
    const { email, password, name } = req.body;
    
    // Check required fields
    if (!email || !password || !name) {
        return res.status(400).json({ 
            error: 'Missing required fields. Required: email, password, name' 
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ 
            error: 'Password must be at least 6 characters long' 
        });
    }
    
    // Validate name
    if (name.trim().length < 2) {
        return res.status(400).json({ 
            error: 'Name must be at least 2 characters long' 
        });
    }
    
    next();
};

// Validation middleware for user login
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Missing required fields. Required: email, password' 
        });
    }
    
    next();
};

// Validation middleware for user preferences
const validatePreferences = (req, res, next) => {
    const { categories, sources } = req.body;
    
    // At least one preference should be provided
    if (!categories && !sources) {
        return res.status(400).json({ 
            error: 'At least one preference (categories or sources) must be provided' 
        });
    }
    
    // Validate categories if provided
    if (categories) {
        if (!Array.isArray(categories)) {
            return res.status(400).json({ 
                error: 'Categories must be an array' 
            });
        }
        
        const validCategories = [
            'business', 'entertainment', 'general', 'health', 
            'science', 'sports', 'technology'
        ];
        
        const invalidCategories = categories.filter(
            cat => !validCategories.includes(cat.toLowerCase())
        );
        
        if (invalidCategories.length > 0) {
            return res.status(400).json({ 
                error: `Invalid categories: ${invalidCategories.join(', ')}. Valid categories: ${validCategories.join(', ')}` 
            });
        }
    }
    
    // Validate sources if provided
    if (sources) {
        if (!Array.isArray(sources)) {
            return res.status(400).json({ 
                error: 'Sources must be an array' 
            });
        }
        
        if (sources.length === 0) {
            return res.status(400).json({ 
                error: 'Sources array cannot be empty' 
            });
        }
    }
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validatePreferences
};
