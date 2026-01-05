import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find admin
        const admin = await Admin.findOne({ adminId: decoded.adminId });

        if (!admin) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        // Add admin to request
        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

export const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    };
};
