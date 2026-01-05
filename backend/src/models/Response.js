import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
    responseId: {
        type: String,
        required: true,
        unique: true,
    },
    formId: {
        type: String,
        required: true,
        ref: 'Form',
        index: true,
    },
    udiseCode: {
        type: String,
        required: true,
        ref: 'School',
        index: true,
    },
    schoolName: {
        type: String,
        required: true,
    },
    districtName: {
        type: String,
        required: true,
        index: true,
    },
    talukaName: {
        type: String,
        required: true,
        index: true,
    },
    responses: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    submittedBy: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['submitted', 'approved', 'rejected'],
        default: 'submitted',
    },
    canEdit: {
        type: Boolean,
        default: false,
    },
    lastEditedAt: {
        type: Date,
    },
});

// Compound index for efficient queries
responseSchema.index({ formId: 1, udiseCode: 1 });
responseSchema.index({ districtName: 1, talukaName: 1 });

const Response = mongoose.model('Response', responseSchema);

export default Response;
