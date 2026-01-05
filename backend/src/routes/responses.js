import express from 'express';
import Response from '../models/Response.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateResponseId } from '../utils/idGenerator.js';

const router = express.Router();

// @route   POST /api/responses/submit
// @desc    Submit form response
// @access  Public
router.post('/responses/submit', async (req, res) => {
    try {
        const {
            formId,
            udiseCode,
            schoolName,
            districtName,
            talukaName,
            responses,
            submittedBy,
        } = req.body;

        const response = new Response({
            responseId: generateResponseId(),
            formId,
            udiseCode,
            schoolName,
            districtName,
            talukaName,
            responses,
            submittedBy,
        });

        await response.save();

        res.status(201).json({
            message: 'Response submitted successfully',
            responseId: response.responseId,
        });
    } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/responses/by-school/:udiseCode
// @desc    Get all responses for a school
// @access  Public
router.get('/responses/by-school/:udiseCode', async (req, res) => {
    try {
        const responses = await Response.find({ udiseCode: req.params.udiseCode })
            .sort({ submittedAt: -1 });

        res.json(responses);
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/responses/check/:udiseCode/:formId
// @desc    Check if form already submitted for school
// @access  Public
router.get('/responses/check/:udiseCode/:formId', async (req, res) => {
    try {
        const response = await Response.findOne({
            udiseCode: req.params.udiseCode,
            formId: req.params.formId
        });

        res.json({
            exists: !!response,
            response: response || null,
        });
    } catch (error) {
        console.error('Error checking response:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/responses/:responseId/update
// @desc    Update existing response
// @access  Public
router.put('/responses/:responseId/update', async (req, res) => {
    try {
        const { responses: responseData } = req.body;

        const response = await Response.findOne({ responseId: req.params.responseId });

        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        // Check if editing is allowed
        if (!response.canEdit) {
            return res.status(403).json({ message: 'Editing not allowed. Please request edit approval first.' });
        }

        // Update response
        response.responses = responseData;
        response.lastEditedAt = new Date();
        response.canEdit = false; // Reset canEdit after update
        await response.save();

        res.json({
            message: 'Response updated successfully',
            response,
        });
    } catch (error) {
        console.error('Error updating response:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/responses/list
// @desc    Get all responses with filters
// @access  Private (Admin)
router.get('/admin/responses/list', authMiddleware, async (req, res) => {
    try {
        const { formId, district, taluka, status, startDate, endDate } = req.query;

        const query = {};
        if (formId) query.formId = formId;
        if (district) query.districtName = district;
        if (taluka) query.talukaName = taluka;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) query.submittedAt.$lte = new Date(endDate);
        }

        const responses = await Response.find(query).sort({ submittedAt: -1 });
        res.json(responses);
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/responses/:responseId
// @desc    Get response by ID
// @access  Private (Admin)
router.get('/admin/responses/:responseId', authMiddleware, async (req, res) => {
    try {
        const response = await Response.findOne({ responseId: req.params.responseId });

        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        res.json(response);
    } catch (error) {
        console.error('Error fetching response:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
