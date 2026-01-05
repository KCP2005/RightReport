import { useState, useEffect } from 'react';
import { responseAPI, editRequestAPI, formAPI } from '../../utils/api';
import DynamicForm from './DynamicForm';

function ViewSubmissions({ school, onBack }) {
    const [submissions, setSubmissions] = useState([]);
    const [editRequests, setEditRequests] = useState([]);
    const [forms, setForms] = useState({}); // Store forms by formId
    const [loading, setLoading] = useState(true);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [editData, setEditData] = useState({});
    const [editReason, setEditReason] = useState('');

    useEffect(() => {
        fetchData();
    }, [school.udiseCode]);

    const fetchData = async () => {
        try {
            const [responsesRes, requestsRes] = await Promise.all([
                responseAPI.getBySchool(school.udiseCode),
                editRequestAPI.getBySchool(school.udiseCode),
            ]);

            const responsesData = responsesRes.data || [];
            setSubmissions(responsesData);
            setEditRequests(requestsRes.data || []);

            // Fetch forms for all unique formIds
            const formIds = [...new Set(responsesData.map(r => r.formId))];
            const formsMap = {};

            for (const formId of formIds) {
                try {
                    const formRes = await formAPI.getFormById(formId);
                    formsMap[formId] = formRes.data;
                } catch (err) {
                    console.error(`Error fetching form ${formId}:`, err);
                }
            }

            setForms(formsMap);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get field label from field ID
    const getFieldLabel = (formId, fieldId) => {
        const form = forms[formId];
        if (!form || !form.fields) {
            return fieldId; // Return the field ID as fallback
        }

        // Find field by fieldId
        const field = form.fields.find(f => f.fieldId === fieldId);

        if (!field) {
            return fieldId; // Return the field ID as fallback
        }

        // Use fieldLabel property from the Form model
        return field.fieldLabel || fieldId;
    };

    const handleRequestEdit = (response) => {
        // Check if user can edit directly (after admin approval)
        if (response.canEdit) {
            // Go to edit mode - will be handled by showing edit form
            setSelectedResponse(response);
            setEditData(response.responses);
            setShowEditForm(true);
        } else {
            // Show request edit form
            setSelectedResponse(response);
            setEditData(response.responses);
            setShowEditForm(true);
        }
    };

    const handleSubmitEditRequest = async (e) => {
        e.preventDefault();

        try {
            await editRequestAPI.createRequest({
                responseId: selectedResponse.responseId,
                udiseCode: school.udiseCode,
                requestedChanges: editData,
                reason: editReason,
                requestedBy: school.hodName,
            });

            setShowEditForm(false);
            setEditReason('');
            fetchData();
        } catch (err) {
            console.error('Error submitting edit request:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (showEditForm && selectedResponse) {
        // If canEdit is true, show the actual DynamicForm for editing
        if (selectedResponse.canEdit) {
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Edit Form Response</h2>
                        <button
                            onClick={() => {
                                setShowEditForm(false);
                                setSelectedResponse(null);
                                setEditData({});
                            }}
                            className="btn btn-secondary btn-sm"
                        >
                            Cancel
                        </button>
                    </div>

                    <DynamicForm
                        school={school}
                        editMode={true}
                        existingResponse={selectedResponse}
                        onFormSubmitted={() => {
                            setShowEditForm(false);
                            setSelectedResponse(null);
                            setEditData({});
                            fetchData(); // Refresh data
                        }}
                        onBack={() => {
                            setShowEditForm(false);
                            setSelectedResponse(null);
                            setEditData({});
                        }}
                    />
                </div>
            );
        }

        // Otherwise, show request edit form (for requesting approval)
        return (
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Edit</h2>

                <form onSubmit={handleSubmitEditRequest} className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Your edit request will be reviewed by an administrator before being approved.
                        </p>
                    </div>

                    {Object.entries(editData).map(([key, value]) => (
                        <div key={key}>
                            <label className="form-label">
                                {getFieldLabel(selectedResponse.formId, key)}
                            </label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="form-label">Reason for Edit *</label>
                        <textarea
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="form-textarea"
                            required
                            rows={4}
                            placeholder="Please explain why you need to edit this submission"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setShowEditForm(false)}
                            className="btn btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary flex-1">
                            Submit Edit Request
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Your Submissions</h2>
                <button onClick={onBack} className="btn btn-secondary btn-sm">
                    Back
                </button>
            </div>

            {/* School Info */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">UDISE:</span>
                        <span className="ml-2 font-medium">{school.udiseCode}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">School:</span>
                        <span className="ml-2 font-medium">{school.schoolName}</span>
                    </div>
                </div>
            </div>

            {/* Submissions */}
            {submissions.length > 0 ? (
                <div className="space-y-6">
                    {submissions.map((submission) => (
                        <div key={submission.responseId} className="card">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Form Response</h3>
                                    <p className="text-sm text-gray-500">
                                        Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`badge ${submission.status === 'approved' ? 'badge-success' :
                                    submission.status === 'rejected' ? 'badge-error' :
                                        'badge-primary'
                                    }`}>
                                    {submission.status}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(submission.responses).map(([key, value]) => (
                                    <div key={key} className="border-b border-gray-100 pb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            {getFieldLabel(submission.formId, key)}:
                                        </span>
                                        <span className="ml-2 text-sm text-gray-900">
                                            {Array.isArray(value) ? value.join(', ') :
                                                (value && (value.url || value.driveLink)) ? (
                                                    <a
                                                        href={value.url || value.driveLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline flex items-center gap-1 inline-flex"
                                                    >
                                                        📎 {value.fileName || 'View File'}
                                                    </a>
                                                ) :
                                                    (typeof value === 'object' ? JSON.stringify(value) : value)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-4">
                                {/* Show Edit Form button if editing is allowed */}
                                {submission.canEdit && (
                                    <button
                                        onClick={() => handleRequestEdit(submission)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        ✏️ Edit Form
                                    </button>
                                )}

                                {/* Show Request Edit button only if no pending request and not already editable */}
                                {!submission.canEdit && !editRequests.some(req => req.responseId === submission.responseId && req.status === 'pending') && (
                                    <button
                                        onClick={() => handleRequestEdit(submission)}
                                        className="btn btn-outline btn-sm"
                                    >
                                        Request Edit
                                    </button>
                                )}

                                {/* Show pending status if there's a pending edit request */}
                                {editRequests.some(req => req.responseId === submission.responseId && req.status === 'pending') && (
                                    <span className="text-sm text-yellow-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Edit request pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">No submissions found for this school.</p>
                </div>
            )}

            {/* Edit Requests */}
            {editRequests.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Requests</h3>
                    <div className="space-y-4">
                        {editRequests.map((request) => (
                            <div key={request.requestId} className="card">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Requested on {new Date(request.requestedAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-700 mt-2">
                                            <strong>Reason:</strong> {request.reason}
                                        </p>
                                    </div>
                                    <span className={`badge ${request.status === 'approved' ? 'badge-success' :
                                        request.status === 'rejected' ? 'badge-error' :
                                            'badge-warning'
                                        }`}>
                                        {request.status}
                                    </span>
                                </div>
                                {request.adminComments && (
                                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                                        <p className="text-sm text-gray-700">
                                            <strong>Admin Comments:</strong> {request.adminComments}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

export default ViewSubmissions;
