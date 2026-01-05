import express from 'express';
import School from '../models/School.js';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import EditRequest from '../models/EditRequest.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const [totalSchools, totalForms, totalResponses, pendingRequests] = await Promise.all([
            School.countDocuments(),
            Form.countDocuments(),
            Response.countDocuments(),
            EditRequest.countDocuments({ status: 'pending' }),
        ]);

        res.json({
            totalSchools,
            totalForms,
            totalResponses,
            pendingRequests,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/analytics/district-wise
// @desc    Get district-wise analytics
// @access  Private (Admin)
router.get('/analytics/district-wise', authMiddleware, async (req, res) => {
    try {
        const districts = await School.distinct('districtName');

        const districtData = await Promise.all(
            districts.map(async (district) => {
                const schoolCount = await School.countDocuments({ districtName: district });
                const responseCount = await Response.countDocuments({ districtName: district });
                const completionRate = schoolCount > 0
                    ? Math.round((responseCount / schoolCount) * 100)
                    : 0;

                return {
                    name: district,
                    schoolCount,
                    responseCount,
                    completionRate,
                };
            })
        );

        res.json(districtData);
    } catch (error) {
        console.error('Error fetching district analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/analytics/taluka-wise
// @desc    Get taluka-wise analytics
// @access  Private (Admin)
router.get('/analytics/taluka-wise', authMiddleware, async (req, res) => {
    try {
        const talukas = await School.aggregate([
            {
                $group: {
                    _id: { district: '$districtName', taluka: '$talukaName' },
                },
            },
        ]);

        const talukaData = await Promise.all(
            talukas.map(async (item) => {
                const { district, taluka } = item._id;
                const schoolCount = await School.countDocuments({
                    districtName: district,
                    talukaName: taluka,
                });
                const responseCount = await Response.countDocuments({
                    districtName: district,
                    talukaName: taluka,
                });
                const completionRate = schoolCount > 0
                    ? Math.round((responseCount / schoolCount) * 100)
                    : 0;

                return {
                    name: taluka,
                    district,
                    schoolCount,
                    responseCount,
                    completionRate,
                };
            })
        );

        res.json(talukaData);
    } catch (error) {
        console.error('Error fetching taluka analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
