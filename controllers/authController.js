const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../models/userModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Register a new user
const register = async (req, res) => {
    try {
        const { email, password, name, preferences } = req.body;
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists with this email' });
        }
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            email: email.toLowerCase(),
            name: name.trim(),
            password: hashedPassword,
            preferences: preferences || [],
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.status(200).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = users.find(user => user.email === email.toLowerCase());
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    getProfile
};
