import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { generateAdminId } from '../utils/idGenerator.js';

const router = express.Router();

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        // Find admin
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { adminId: admin.adminId, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            admin: {
                adminId: admin.adminId,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/logout
// @desc    Admin logout (client-side token removal)
// @access  Public
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// @route   POST /api/admin/create
// @desc    Create new admin (for initial setup)
// @access  Public (should be protected in production)
router.post('/create', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email, and password' });
        }

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this username or email already exists' });
        }

        // Create admin
        const admin = new Admin({
            adminId: generateAdminId(),
            username,
            email,
            password,
            role: 'admin',
        });

        await admin.save();

        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                adminId: admin.adminId,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
