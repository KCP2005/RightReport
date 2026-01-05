import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
    udiseCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    schoolName: {
        type: String,
        required: true,
        trim: true,
    },
    districtName: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    talukaName: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    hodName: {
        type: String,
        required: true,
        trim: true,
    },
    hodPhone: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for faster queries
schoolSchema.index({ districtName: 1, talukaName: 1 });
schoolSchema.index({ schoolName: 'text' });

const School = mongoose.model('School', schoolSchema);

export default School;
