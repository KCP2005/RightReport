import { useState, useEffect } from 'react';
import { editRequestAPI, formAPI } from '../../utils/api';

function EditRequestsManager() {
    const [requests, setRequests] = useState([]);
    const [forms, setForms] = useState({}); // Store forms by formId
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [comments, setComments] = useState('');

    const [totalRequests, setTotalRequests] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    useEffect(() => {
        fetchRequests();
    }, [filter, currentPage]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const status = filter === 'all' ? '' : filter;
            const response = await editRequestAPI.getAllRequests(currentPage, itemsPerPage, status);

            const data = response.data;
            if (data.data) {
                setRequests(data.data);
                setTotalPages(data.totalPages);
                setTotalRequests(data.totalRequests);
            } else {
                // Fallback for non-paginated response
                setRequests(data);
                setTotalPages(1);
                setTotalRequests(data.length);
            }

            // Fetch forms for all unique formIds
            const uniqueRequests = data.data || data;
            if (!Array.isArray(uniqueRequests)) return;

            const formIds = [...new Set(uniqueRequests.map(r => r.formId).filter(Boolean))];

            // Only fetch forms we don't have yet
            const missingFormIds = formIds.filter(id => !forms[id]);

            if (missingFormIds.length > 0) {
                const newForms = { ...forms };
                for (const formId of missingFormIds) {
                    try {
                        const formRes = await formAPI.getFormById(formId);
                        newForms[formId] = formRes.data;
                    } catch (err) {
                        console.error(`Error fetching form ${formId}:`, err);
                    }
                }
                setForms(newForms);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get field label from field ID
    const getFieldLabel = (formId, fieldId) => {
        const form = forms[formId];
        if (!form || !form.fields) {
            return fieldId;
        }

        const field = form.fields.find(f => f.fieldId === fieldId);
        return field ? field.fieldLabel : fieldId;
    };

    // Helper to format requested changes with labels
    const formatChanges = (formId, changes) => {
        if (!changes || typeof changes !== 'object') return JSON.stringify(changes, null, 2);

        const labeled = {};
        Object.entries(changes).forEach(([key, value]) => {
            const label = getFieldLabel(formId, key);
            labeled[label] = value;
        });
        return JSON.stringify(labeled, null, 2);
    };

    const handleApprove = async (requestId) => {
        try {
            await editRequestAPI.approveRequest(requestId, { comments });
            setSelectedRequest(null);
            setComments('');
            fetchRequests(); // Refresh current page
            alert('Edit request approved successfully');
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request');
        }
    };

    const handleReject = async (requestId) => {
        if (!comments.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await editRequestAPI.rejectRequest(requestId, { comments });
            setSelectedRequest(null);
            setComments('');
            fetchRequests(); // Refresh current page
            alert('Edit request rejected');
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Filter Tabs & Summary */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2">
                        {['pending', 'approved', 'rejected', 'all'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${filter === status
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    {totalRequests > 0 && (
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalRequests)}</span> of <span className="font-medium">{totalRequests}</span> requests
                        </div>
                    )}
                </div>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No {filter} requests</h3>
                    <p className="text-gray-600">Edit requests will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.requestId} className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">UDISE: {request.udiseCode}</h3>
                                    <p className="text-sm text-gray-600">
                                        Requested by: {request.requestedBy} on{' '}
                                        {new Date(request.requestedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span
                                    className={`badge ${request.status === 'pending'
                                        ? 'badge-warning'
                                        : request.status === 'approved'
                                            ? 'badge-success'
                                            : 'badge-error'
                                        }`}
                                >
                                    {request.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Reason for Edit:</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                            </div>

                            {selectedRequest?.requestId === request.requestId ? (
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Original Data:</p>
                                            <div className="bg-gray-50 p-3 rounded-lg space-y-2 max-h-40 overflow-auto">
                                                {request.originalData && Object.keys(request.originalData).length > 0 ? (
                                                    Object.entries(request.originalData).map(([fieldId, value]) => (
                                                        <div key={fieldId} className="text-xs border-b border-gray-200 pb-1 last:border-0">
                                                            <span className="font-medium text-gray-700">
                                                                {getFieldLabel(request.formId, fieldId)}:
                                                            </span>
                                                            <span className="ml-2 text-gray-900">
                                                                {Array.isArray(value) ? value.join(', ') :
                                                                    (value && (value.url || value.driveLink)) ? (
                                                                        <a
                                                                            href={value.url || value.driveLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                                        >
                                                                            📎 {value.fileName || 'View File'}
                                                                        </a>
                                                                    ) :
                                                                        (typeof value === 'object' ? JSON.stringify(value) : value)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">
                                                        Original data not available (old request)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Requested Changes:</p>
                                            <div className="bg-blue-50 p-3 rounded-lg space-y-2 max-h-40 overflow-auto">
                                                {request.requestedChanges && Object.entries(request.requestedChanges).map(([fieldId, value]) => (
                                                    <div key={fieldId} className="text-xs border-b border-blue-200 pb-1 last:border-0">
                                                        <span className="font-medium text-blue-900">
                                                            {getFieldLabel(request.formId, fieldId)}:
                                                        </span>
                                                        <span className="ml-2 text-blue-900 font-semibold">
                                                            {Array.isArray(value) ? value.join(', ') :
                                                                (value && (value.url || value.driveLink)) ? (
                                                                    <a
                                                                        href={value.url || value.driveLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-700 hover:underline inline-flex items-center gap-1"
                                                                    >
                                                                        📎 {value.fileName || 'View File'}
                                                                    </a>
                                                                ) :
                                                                    (typeof value === 'object' ? JSON.stringify(value) : value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Admin Comments</label>
                                        <textarea
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            className="form-textarea"
                                            rows="3"
                                            placeholder="Add comments (required for rejection)"
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(request.requestId)}
                                            className="btn btn-primary btn-sm"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.requestId)}
                                            className="btn btn-outline btn-sm text-red-500 border-red-500"
                                        >
                                            ✕ Reject
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(null);
                                                setComments('');
                                            }}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    {request.status === 'pending' && (
                                        <button
                                            onClick={() => setSelectedRequest(request)}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Review Request
                                        </button>
                                    )}
                                    {request.adminComments && (
                                        <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs font-medium text-gray-700">Admin Comments:</p>
                                            <p className="text-sm text-gray-600">{request.adminComments}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 0 && (
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EditRequestsManager;
