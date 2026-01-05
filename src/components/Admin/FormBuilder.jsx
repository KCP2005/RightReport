import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const FIELD_TYPES = [
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'number', label: 'Number', icon: '🔢' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'phone', label: 'Phone', icon: '📱' },
    { id: 'textarea', label: 'Long Text', icon: '📄' },
    { id: 'dropdown', label: 'Dropdown', icon: '▼' },
    { id: 'radio', label: 'Radio', icon: '⭕' },
    { id: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { id: 'date', label: 'Date', icon: '📅' },
    { id: 'file', label: 'File Upload', icon: '📎' },
];

function FormBuilder({ initialForm, onSave, onCancel }) {
    const [formTitle, setFormTitle] = useState(initialForm?.formTitle || '');
    const [formDescription, setFormDescription] = useState(initialForm?.formDescription || '');
    const [fields, setFields] = useState(initialForm?.fields || []);
    const [editingField, setEditingField] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);

    const addField = (fieldType) => {
        const newField = {
            fieldId: `field_${Date.now()}`,
            fieldLabel: `New ${fieldType} field`,
            fieldType,
            required: false,
            options: fieldType === 'dropdown' || fieldType === 'radio' || fieldType === 'checkbox' ? ['Option 1'] : [],
            helpText: '',
        };
        setFields([...fields, newField]);
        setEditingField(fields.length);
    };

    const updateField = (index, updates) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        setFields(newFields);
    };

    const deleteField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
        setEditingField(null);
    };

    const moveField = (index, direction) => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) return;

        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFields(items);
    };

    const handleSave = () => {
        if (!formTitle.trim()) {
            alert('Please enter a form title');
            return;
        }
        if (fields.length === 0) {
            alert('Please add at least one field to the form');
            return;
        }

        const formData = {
            formTitle,
            formDescription,
            fields,
        };
        onSave(formData);
    };

    if (previewMode) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Form Preview</h2>
                        <button onClick={() => setPreviewMode(false)} className="btn btn-secondary btn-sm">
                            Back to Editor
                        </button>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{formTitle || 'Untitled Form'}</h3>
                    {formDescription && <p className="text-gray-600 mb-6">{formDescription}</p>}

                    <div className="space-y-6">
                        {fields.map((field) => (
                            <div key={field.fieldId}>
                                <label className="form-label">
                                    {field.fieldLabel}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.helpText && <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>}

                                {(field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'phone') && (
                                    <input type={field.fieldType} className="form-input" placeholder={field.fieldLabel} />
                                )}

                                {field.fieldType === 'number' && (
                                    <input type="number" className="form-input" placeholder={field.fieldLabel} />
                                )}

                                {field.fieldType === 'textarea' && (
                                    <textarea className="form-textarea" rows="4" placeholder={field.fieldLabel}></textarea>
                                )}

                                {field.fieldType === 'date' && <input type="date" className="form-input" />}

                                {field.fieldType === 'dropdown' && (
                                    <select className="form-select">
                                        <option value="">Select an option</option>
                                        {field.options.map((opt, idx) => (
                                            <option key={idx} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {field.fieldType === 'radio' && (
                                    <div className="space-y-2">
                                        {field.options.map((opt, idx) => (
                                            <label key={idx} className="flex items-center gap-2">
                                                <input type="radio" name={field.fieldId} value={opt} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.fieldType === 'checkbox' && (
                                    <div className="space-y-2">
                                        {field.options.map((opt, idx) => (
                                            <label key={idx} className="flex items-center gap-2">
                                                <input type="checkbox" value={opt} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Field Types Palette */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Field Types</h3>
                    <div className="space-y-2">
                        {FIELD_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => addField(type.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                            >
                                <span className="text-2xl">{type.icon}</span>
                                <span className="text-sm font-medium text-gray-700">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form Builder */}
            <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="mb-6">
                        <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Form Title"
                            className="text-2xl font-bold border-none focus:outline-none focus:ring-0 w-full mb-2 px-0"
                        />
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Form description (optional)"
                            className="text-gray-600 border-none focus:outline-none focus:ring-0 w-full resize-none px-0"
                            rows="2"
                        ></textarea>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="fields">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                    {fields.length === 0 && (
                                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                                            <p className="text-lg">👈 Click on a field type to add it to your form</p>
                                        </div>
                                    )}

                                    {fields.map((field, index) => (
                                        <Draggable key={field.fieldId} draggableId={field.fieldId} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`border rounded-lg p-4 ${snapshot.isDragging ? 'shadow-lg' : ''
                                                        } ${editingField === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div {...provided.dragHandleProps} className="cursor-move text-gray-400 mt-2 text-xl">
                                                            ⋮⋮
                                                        </div>

                                                        <div className="flex-1">
                                                            {editingField === index ? (
                                                                <FieldEditor
                                                                    field={field}
                                                                    onUpdate={(updates) => updateField(index, updates)}
                                                                    onClose={() => setEditingField(null)}
                                                                    onDelete={() => deleteField(index)}
                                                                />
                                                            ) : (
                                                                <div onClick={() => setEditingField(index)} className="cursor-pointer">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="font-medium text-gray-900">
                                                                                {field.fieldLabel}
                                                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500 capitalize">{field.fieldType}</p>
                                                                            {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveField(index, 'up');
                                                                                }}
                                                                                disabled={index === 0}
                                                                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                                            >
                                                                                ↑
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveField(index, 'down');
                                                                                }}
                                                                                disabled={index === fields.length - 1}
                                                                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                                            >
                                                                                ↓
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (confirm('Delete this field?')) deleteField(index);
                                                                                }}
                                                                                className="text-red-500 hover:text-red-700"
                                                                            >
                                                                                🗑️
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button onClick={handleSave} className="btn btn-primary">
                        💾 Save Form
                    </button>
                    <button onClick={() => setPreviewMode(true)} className="btn btn-secondary" disabled={fields.length === 0}>
                        👁️ Preview
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} className="btn btn-outline">
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function FieldEditor({ field, onUpdate, onClose, onDelete }) {
    const [label, setLabel] = useState(field.fieldLabel);
    const [required, setRequired] = useState(field.required);
    const [helpText, setHelpText] = useState(field.helpText || '');
    const [options, setOptions] = useState(field.options || []);
    const [allowedFileTypes, setAllowedFileTypes] = useState(field.allowedFileTypes || ['image/jpeg', 'image/png', 'application/pdf']);
    const [maxFileSize, setMaxFileSize] = useState(field.maxFileSize || 5);
    const [compressionEnabled, setCompressionEnabled] = useState(field.compressionEnabled !== false); // Default true

    const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(field.fieldType);

    const addOption = () => {
        setOptions([...options, `Option ${options.length + 1}`]);
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const deleteOption = (index) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!label.trim()) {
            alert('Field label is required');
            return;
        }
        if (hasOptions && options.length === 0) {
            alert('Please add at least one option');
            return;
        }

        onUpdate({
            fieldLabel: label,
            required,
            helpText,
            options: hasOptions ? options : [],
            allowedFileTypes: field.fieldType === 'file' ? allowedFileTypes : undefined,
            maxFileSize: field.fieldType === 'file' ? maxFileSize : undefined,
            compressionEnabled: field.fieldType === 'file' ? compressionEnabled : undefined,
        });
        onClose();
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="form-label">Field Label</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="form-input"
                    placeholder="Enter field label"
                />
            </div>

            <div>
                <label className="form-label">Help Text (optional)</label>
                <input
                    type="text"
                    value={helpText}
                    onChange={(e) => setHelpText(e.target.value)}
                    className="form-input"
                    placeholder="Additional instructions for this field"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    id={`required-${field.fieldId}`}
                />
                <label htmlFor={`required-${field.fieldId}`} className="text-sm font-medium text-gray-700">
                    Required field
                </label>
            </div>

            {field.fieldType === 'file' && (
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-900">File Settings</h4>

                    <div>
                        <label className="form-label">Allowed File Types</label>
                        <div className="space-y-2">
                            {[
                                { val: 'image/jpeg', label: 'JPEG Images' },
                                { val: 'image/png', label: 'PNG Images' },
                                { val: 'application/pdf', label: 'PDF Documents' }
                            ].map(type => (
                                <label key={type.val} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={allowedFileTypes.includes(type.val)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAllowedFileTypes([...allowedFileTypes, type.val]);
                                            } else {
                                                setAllowedFileTypes(allowedFileTypes.filter(t => t !== type.val));
                                            }
                                        }}
                                    />
                                    <span className="text-sm">{type.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Max File Size (MB)</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={maxFileSize}
                            onChange={(e) => setMaxFileSize(Number(e.target.value))}
                            className="form-input"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={compressionEnabled}
                            onChange={(e) => setCompressionEnabled(e.target.checked)}
                            id={`compression-${field.fieldId}`}
                        />
                        <label htmlFor={`compression-${field.fieldId}`} className="text-sm font-medium text-gray-700">
                            Enable Compression (Images/PDFs)
                        </label>
                    </div>
                </div>
            )}

            {hasOptions && (
                <div>
                    <label className="form-label">Options</label>
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    className="form-input"
                                    placeholder={`Option ${index + 1}`}
                                />
                                {options.length > 1 && (
                                    <button onClick={() => deleteOption(index)} className="text-red-500 hover:text-red-700 px-2">
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={addOption} className="btn btn-secondary btn-sm">
                            + Add Option
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
                <button onClick={handleSave} className="btn btn-primary btn-sm">
                    Save Changes
                </button>
                <button onClick={onClose} className="btn btn-secondary btn-sm">
                    Cancel
                </button>
                <button
                    onClick={() => {
                        if (confirm('Delete this field?')) onDelete();
                    }}
                    className="btn btn-outline btn-sm text-red-500 border-red-500 ml-auto"
                >
                    Delete Field
                </button>
            </div>
        </div>
    );
}

export default FormBuilder;
