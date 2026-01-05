import express from 'express';
import Form from '../models/Form.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateFormId } from '../utils/idGenerator.js';

const router = express.Router();

// @route   GET /api/forms/active
// @desc    Get all active forms
// @access  Public
router.get('/forms/active', async (req, res) => {
    try {
        const forms = await Form.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/forms/:formId
// @desc    Get form by ID
// @access  Public
router.get('/forms/:formId', async (req, res) => {
    try {
        const form = await Form.findOne({ formId: req.params.formId });

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        res.json(form);
    } catch (error) {
        console.error('Error fetching form:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/forms/create
// @desc    Create new form
// @access  Private (Admin)
router.post('/admin/forms/create', authMiddleware, async (req, res) => {
    try {
        const { formTitle, formDescription, fields } = req.body;

        // Deactivate all other forms since new form defaults to active
        await Form.updateMany({}, { isActive: false });

        const form = new Form({
            formId: generateFormId(),
            formTitle,
            formDescription,
            fields,
            createdBy: req.admin.username,
        });

        await form.save();

        res.status(201).json({
            message: 'Form created successfully',
            form,
        });
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/forms/list
// @desc    Get all forms (admin)
// @access  Private (Admin)
router.get('/admin/forms/list', authMiddleware, async (req, res) => {
    try {
        const forms = await Form.find().sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/forms/:formId
// @desc    Update form
// @access  Private (Admin)
router.put('/admin/forms/:formId', authMiddleware, async (req, res) => {
    try {
        const { formTitle, formDescription, fields, isActive } = req.body;

        // If setting to active, deactivate all others first
        if (isActive === true) {
            await Form.updateMany({ formId: { $ne: req.params.formId } }, { isActive: false });
        }

        const form = await Form.findOne({ formId: req.params.formId });

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        if (formTitle) form.formTitle = formTitle;
        if (formDescription !== undefined) form.formDescription = formDescription;
        if (fields) form.fields = fields;
        if (isActive !== undefined) form.isActive = isActive;

        await form.save();

        res.json({
            message: 'Form updated successfully',
            form,
        });
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/forms/:formId
// @desc    Delete form
// @access  Private (Admin)
router.delete('/admin/forms/:formId', authMiddleware, async (req, res) => {
    try {
        const form = await Form.findOneAndDelete({ formId: req.params.formId });

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
