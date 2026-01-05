import express from 'express';
import EditRequest from '../models/EditRequest.js';
import Response from '../models/Response.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateRequestId } from '../utils/idGenerator.js';

const router = express.Router();

// @route   POST /api/edit-requests/create
// @desc    Create edit request
// @access  Public
router.post('/edit-requests/create', async (req, res) => {
    try {
        const {
            responseId,
            udiseCode,
            requestedChanges,
            reason,
            requestedBy,
        } = req.body;

        // Verify response exists
        const response = await Response.findOne({ responseId });
        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        const editRequest = new EditRequest({
            requestId: generateRequestId(),
            responseId,
            udiseCode,
            formId: response.formId,
            requestedChanges,
            originalData: response.responses, // Store original data
            reason,
            requestedBy,
        });

        await editRequest.save();

        res.status(201).json({
            message: 'Edit request submitted successfully',
            requestId: editRequest.requestId,
        });
    } catch (error) {
        console.error('Error creating edit request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/edit-requests/by-school/:udiseCode
// @desc    Get all edit requests for a school
// @access  Public
router.get('/edit-requests/by-school/:udiseCode', async (req, res) => {
    try {
        const requests = await EditRequest.find({ udiseCode: req.params.udiseCode })
            .sort({ requestedAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching edit requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/edit-requests/pending
// @desc    Get all pending edit requests
// @access  Private (Admin)
router.get('/admin/edit-requests/pending', authMiddleware, async (req, res) => {
    try {
        const requests = await EditRequest.find({ status: 'pending' })
            .sort({ requestedAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/edit-requests/all
// @desc    Get all edit requests (optionally filtered by status) with pagination
// @access  Private (Admin)
router.get('/admin/edit-requests/all', authMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = status && status !== 'all' ? { status } : {};

        const count = await EditRequest.countDocuments(query);
        const requests = await EditRequest.find(query)
            .sort({ requestedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            data: requests,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalRequests: count
        });
    } catch (error) {
        console.error('Error fetching all requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/edit-requests/:requestId/approve
// @desc    Approve edit request
// @access  Private (Admin)
router.put('/admin/edit-requests/:requestId/approve', authMiddleware, async (req, res) => {
    try {
        const { comments } = req.body;

        const editRequest = await EditRequest.findOne({ requestId: req.params.requestId });

        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        // Enable editing on the original response
        const response = await Response.findOne({ responseId: editRequest.responseId });
        if (response) {
            response.canEdit = true; // Allow user to edit
            await response.save();
        }

        // Update edit request status
        editRequest.status = 'approved';
        editRequest.reviewedBy = req.admin.username;
        editRequest.reviewedAt = new Date();
        editRequest.adminComments = comments;
        await editRequest.save();

        res.json({
            message: 'Edit request approved successfully',
            editRequest,
        });
    } catch (error) {
        console.error('Error approving edit request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/edit-requests/:requestId/reject
// @desc    Reject edit request
// @access  Private (Admin)
router.put('/admin/edit-requests/:requestId/reject', authMiddleware, async (req, res) => {
    try {
        const { comments } = req.body;

        const editRequest = await EditRequest.findOne({ requestId: req.params.requestId });

        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        editRequest.status = 'rejected';
        editRequest.reviewedBy = req.admin.username;
        editRequest.reviewedAt = new Date();
        editRequest.adminComments = comments;
        await editRequest.save();

        res.json({
            message: 'Edit request rejected',
            editRequest,
        });
    } catch (error) {
        console.error('Error rejecting edit request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
