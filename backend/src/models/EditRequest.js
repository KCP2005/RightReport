import mongoose from 'mongoose';

const editRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
    },
    responseId: {
        type: String,
        required: true,
        ref: 'Response',
    },
    udiseCode: {
        type: String,
        required: true,
        index: true,
    },
    requestedChanges: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    originalData: {
        type: mongoose.Schema.Types.Mixed,
        required: false, // Optional for backward compatibility
    },
    formId: {
        type: String,
        required: false, // Optional for backward compatibility
    },
    reason: {
        type: String,
        required: true,
    },
    requestedBy: {
        type: String,
        required: true,
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    reviewedBy: {
        type: String,
    },
    reviewedAt: {
        type: Date,
    },
    adminComments: {
        type: String,
    },
});

const EditRequest = mongoose.model('EditRequest', editRequestSchema);

export default EditRequest;
