import { useState, useEffect } from 'react';
import { formAPI, responseAPI, schoolAPI } from '../../utils/api';

import FileUploadField from './FileUploadField';

function DynamicForm({ school, onFormSubmitted, onBack, editMode = false, existingResponse = null }) {
    const [forms, setForms] = useState([]);
    const [selectedFormId, setSelectedFormId] = useState('');
    const [formData, setFormData] = useState(null);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [activeUploads, setActiveUploads] = useState(0);

    // School editing state
    const [isEditingSchool, setIsEditingSchool] = useState(false);
    const [localSchool, setLocalSchool] = useState(school);
    const [editSchoolForm, setEditSchoolForm] = useState({
        hodName: school.hodName || '',
        hodPhone: school.hodPhone || ''
    });

    useEffect(() => {
        setLocalSchool(school);
        setEditSchoolForm({
            hodName: school.hodName || '',
            hodPhone: school.hodPhone || ''
        });
    }, [school]);

    const handleUploadStart = () => {
        setActiveUploads(prev => prev + 1);
    };

    const handleUploadEnd = () => {
        setActiveUploads(prev => Math.max(0, prev - 1));
    };

    const handleSchoolUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await schoolAPI.updateSchool(school.udiseCode, editSchoolForm);
            setLocalSchool(res.data.school);
            setIsEditingSchool(false);
            // Optionally show temporary success message
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update school info');
        } finally {
            setLoading(false);
        }
    };

    const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);

    useEffect(() => {
        if (editMode && existingResponse) {
            // Edit mode: load specific form and pre-fill data
            loadFormForEdit();
        } else {
            // Create mode: load all active forms
            fetchActiveForms();
        }
    }, [editMode, existingResponse]);

    // Check for existing text submission when form changes (and not in explicit edit mode)
    useEffect(() => {
        if (selectedFormId && !editMode && school) {
            checkExistingSubmission(selectedFormId);
        }
    }, [selectedFormId, editMode, school]);

    const checkExistingSubmission = async (formId) => {
        try {
            const res = await responseAPI.checkSubmission(school.udiseCode, formId);
            if (res.data.exists) {
                setHasAlreadySubmitted(true);
            } else {
                setHasAlreadySubmitted(false);
            }
        } catch (err) {
            console.error('Error checking submission:', err);
        }
    };

    const loadFormForEdit = async () => {
        try {
            const response = await formAPI.getFormById(existingResponse.formId);
            setFormData(response.data);
            setSelectedFormId(existingResponse.formId);
            setResponses(existingResponse.responses); // Pre-fill with existing data
        } catch (err) {
            setError('Failed to load form');
        }
    };

    const fetchActiveForms = async () => {
        try {
            const response = await formAPI.getActiveForms();
            setForms(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedFormId(response.data[0].formId);
                setFormData(response.data[0]);
            }
        } catch (err) {
            setError('Failed to load forms');
        }
    };

    const handleFormChange = (formId) => {
        setSelectedFormId(formId);
        // Form data update happens in effect or separate call?
        // Original code did: setFormData(form); setResponses({});
        // We need to keep that logic but moving it here or into effect?
        // Original code:
        /*
        const handleFormChange = (formId) => {
            setSelectedFormId(formId);
            const form = forms.find(f => f.formId === formId);
            setFormData(form);
            setResponses({});
        };
        */
        // I need to preserve this logic.
        const form = forms.find(f => f.formId === formId);
        setFormData(form);
        setResponses({});
        setHasAlreadySubmitted(false); // Reset first, effect will check again
    };

    const handleInputChange = (fieldId, value) => {
        setResponses(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Manual Validation to ensure required fields are filled
        // This is necessary because some fields (like FileUpload) might not trigger native browser validation
        if (formData?.fields) {
            for (const field of formData.fields) {
                if (field.required) {
                    const value = responses[field.fieldId];
                    const isEmpty =
                        value === undefined ||
                        value === null ||
                        value === '' ||
                        (typeof value === 'string' && value.trim() === '') ||
                        (Array.isArray(value) && value.length === 0); // Check for empty arrays (checkboxes)

                    if (isEmpty) {
                        setError(`Please answer the required field: "${field.fieldLabel}"`);
                        // Scroll to the error message
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                }
            }
        }

        setLoading(true);

        try {
            if (editMode && existingResponse) {
                // Update existing response
                await responseAPI.updateResponse(existingResponse.responseId, {
                    responses: responses,
                });
            } else {
                // Create new response
                const submissionData = {
                    formId: selectedFormId,
                    udiseCode: school.udiseCode,
                    schoolName: school.schoolName,
                    districtName: school.districtName,
                    talukaName: school.talukaName,
                    responses: responses,
                    submittedBy: school.hodName,
                };
                await responseAPI.submitResponse(submissionData);
            }

            setSuccess(true);
            setTimeout(() => {
                onFormSubmitted();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editMode ? 'update' : 'submit'} form`);
        } finally {
            setLoading(false);
        }
    };

    // ... renderField ...

    if (hasAlreadySubmitted && !editMode) {
        return (
            <div className="max-w-xl mx-auto px-4 mt-8">
                <div className="bg-white rounded-2xl p-8 text-center shadow-xl border border-gray-100 animate-fade-in relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-secondary-500"></div>

                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                        �
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Form Already Submitted</h3>

                    <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                        You have already submitted a response for <br />
                        <span className="font-semibold text-primary-600">{formData?.formTitle}</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={onFormSubmitted} // Redirects to ViewSubmissions
                            className="btn btn-primary w-full sm:w-auto px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            View/Edit My Submission
                        </button>

                        <button
                            onClick={onBack}
                            className="btn btn-outline w-full sm:w-auto px-8 py-3"
                        >
                            Choose Different School
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderField = (field) => {
        const value = responses[field.fieldId] || '';

        switch (field.fieldType) {
            case 'file':
                return (
                    <FileUploadField
                        field={field}
                        value={value}
                        onChange={handleInputChange}
                        onUploadStart={handleUploadStart}
                        onUploadEnd={handleUploadEnd}
                    />
                );

            case 'email':
                return (
                    <input
                        type="email"
                        value={value}
                        onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                        className="form-input"
                        required={field.required}
                        placeholder={field.helpText || ''}
                    />
                );

            case 'phone':
                return (
                    <input
                        type="tel"
                        value={value}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Only allow digits
                            if (val === '' || /^\d+$/.test(val)) {
                                handleInputChange(field.fieldId, val);
                            }
                        }}
                        className="form-input"
                        required={field.required}
                        placeholder={field.helpText || '10-digit mobile number'}
                        maxLength={10}
                        pattern="\d{10}"
                        title="Please enter a valid 10-digit phone number"
                    />
                );

            case 'text':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                        className="form-input"
                        required={field.required}
                        placeholder={field.helpText || ''}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                        className="form-input"
                        required={field.required}
                        placeholder={field.helpText || ''}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                        className="form-textarea"
                        required={field.required}
                        placeholder={field.helpText || ''}
                        rows={4}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                        className="form-input"
                        required={field.required}
                    />
                );

            case 'dropdown':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                        className="form-select"
                        required={field.required}
                    >
                        <option value="">Select an option</option>
                        {field.options?.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={field.fieldId}
                                    value={option}
                                    checked={value === option}
                                    onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                                    required={field.required}
                                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={Array.isArray(value) && value.includes(option)}
                                    onChange={(e) => {
                                        const currentValues = Array.isArray(value) ? value : [];
                                        const newValues = e.target.checked
                                            ? [...currentValues, option]
                                            : currentValues.filter(v => v !== option);
                                        handleInputChange(field.fieldId, newValues);
                                    }}
                                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    if (success) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {editMode ? 'Form Updated Successfully!' : 'Form Submitted Successfully!'}
                </h3>
                <p className="text-gray-600">Redirecting to view your submissions...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* School Info Card */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">School Information</h3>
                </div>

                {isEditingSchool ? (
                    <form onSubmit={handleSchoolUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 block mb-1">UDISE Code:</span>
                                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded block w-full">{school.udiseCode}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 block mb-1">School Name:</span>
                                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded block w-full">{school.schoolName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 block mb-1">District:</span>
                                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded block w-full">{school.districtName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 block mb-1">Taluka:</span>
                                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded block w-full">{school.talukaName}</span>
                            </div>
                            <div>
                                <label className="text-gray-600 block mb-1">HOD Name *</label>
                                <input
                                    type="text"
                                    value={editSchoolForm.hodName}
                                    onChange={e => setEditSchoolForm(prev => ({ ...prev, hodName: e.target.value }))}
                                    className="form-input text-sm py-1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-gray-600 block mb-1">HOD Phone *</label>
                                <input
                                    type="tel"
                                    value={editSchoolForm.hodPhone}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setEditSchoolForm(prev => ({ ...prev, hodPhone: val }));
                                        }
                                    }}
                                    className="form-input text-sm py-1"
                                    maxLength={10}
                                    pattern="\d{10}"
                                    title="Please enter a valid 10-digit phone number"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditingSchool(false)}
                                className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="text-sm px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">UDISE Code:</span>
                                <span className="ml-2 font-medium text-gray-900">{school.udiseCode}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">School Name:</span>
                                <span className="ml-2 font-medium text-gray-900">{school.schoolName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">District:</span>
                                <span className="ml-2 font-medium text-gray-900">{school.districtName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Taluka:</span>
                                <span className="ml-2 font-medium text-gray-900">{school.talukaName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">HOD Name:</span>
                                <span className="ml-2 font-medium text-gray-900">{localSchool.hodName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">HOD Phone:</span>
                                <span className="ml-2 font-medium text-gray-900">{localSchool.hodPhone}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                            <p className="text-red-700 font-semibold italic">
                                If the school information is incorrect or not up to date, please update it.
                            </p>
                            <button
                                onClick={() => setIsEditingSchool(true)}
                                className="text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                                Edit Info
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Form Selection */}
            {forms.length > 1 && (
                <div className="mb-6">
                    <label className="form-label">Select Form</label>
                    <select
                        value={selectedFormId}
                        onChange={(e) => handleFormChange(e.target.value)}
                        className="form-select"
                    >
                        {forms.map((form) => (
                            <option key={form.formId} value={form.formId}>
                                {form.formTitle}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {formData ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.formTitle}</h2>
                        {formData.formDescription && (
                            <p className="text-gray-600">{formData.formDescription}</p>
                        )}
                    </div>

                    {formData.fields?.map((field) => (
                        <div key={field.fieldId} className="space-y-2">
                            <label className="form-label">
                                {field.fieldLabel}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderField(field)}
                            {field.helpText && (
                                <p className="text-xs text-gray-500">{field.helpText}</p>
                            )}
                        </div>
                    ))}

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onBack}
                            className="btn btn-secondary flex-1"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading || activeUploads > 0}
                            className={`btn flex-1 ${loading || activeUploads > 0 ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Submitting...
                                </span>
                            ) : activeUploads > 0 ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Wait for Upload...
                                </span>
                            ) : (
                                'Submit Form'
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600">No active forms available at the moment.</p>
                    <button onClick={onBack} className="btn btn-secondary mt-4">
                        Go Back
                    </button>
                </div>
            )}


        </div>
    );
}

export default DynamicForm;
