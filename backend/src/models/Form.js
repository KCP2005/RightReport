import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
    formId: {
        type: String,
        required: true,
        unique: true,
    },
    formTitle: {
        type: String,
        required: true,
        trim: true,
    },
    formDescription: {
        type: String,
        trim: true,
    },
    fields: [{
        fieldId: {
            type: String,
            required: true,
        },
        fieldLabel: {
            type: String,
            required: true,
        },
        fieldType: {
            type: String,
            required: true,
            enum: ['text', 'number', 'dropdown', 'radio', 'checkbox', 'date', 'textarea', 'file', 'email', 'phone'],
        },
        options: [String],
        required: {
            type: Boolean,
            default: false,
        },
        helpText: String,
        validation: {
            type: mongoose.Schema.Types.Mixed,
        },
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

formSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Form = mongoose.model('Form', formSchema);

export default Form;
