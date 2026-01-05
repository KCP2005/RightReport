import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { schoolAPI, responseAPI, formAPI } from '../utils/api';

function SchoolDetailPage() {
    const { udiseCode } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [responses, setResponses] = useState([]);
    const [forms, setForms] = useState({}); // Store forms by formId
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchoolData();
    }, [udiseCode]);

    const fetchSchoolData = async () => {
        try {
            const [schoolRes, responsesRes] = await Promise.all([
                schoolAPI.searchByUDISE(udiseCode),
                responseAPI.getBySchool(udiseCode),
            ]);

            setSchool(schoolRes.data);
            const responsesData = responsesRes.data || [];
            setResponses(responsesData);

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
            console.error('Error fetching school data:', err);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!school) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">School not found</p>
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline btn-sm mb-4">
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{school.schoolName}</h1>
                    <p className="text-gray-600">UDISE: {school.udiseCode}</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* School Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">School Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">District</p>
                            <p className="font-medium text-gray-900">{school.districtName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Taluka</p>
                            <p className="font-medium text-gray-900">{school.talukaName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">HOD Name</p>
                            <p className="font-medium text-gray-900">{school.hodName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">HOD Phone</p>
                            <p className="font-medium text-gray-900">{school.hodPhone}</p>
                        </div>
                    </div>
                </div>

                {/* Responses */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Form Responses</h2>
                    {responses.length > 0 ? (
                        <div className="space-y-4">
                            {responses.map((response) => (
                                <div key={response.responseId} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-medium text-gray-900">Response ID: {response.responseId}</p>
                                            <p className="text-sm text-gray-600">
                                                Submitted: {new Date(response.submittedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`badge ${response.status === 'approved' ? 'badge-success' :
                                            response.status === 'rejected' ? 'badge-error' :
                                                'badge-primary'
                                            }`}>
                                            {response.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(response.responses).map(([key, value]) => (
                                            <div key={key} className="text-sm">
                                                <span className="text-gray-600">
                                                    {getFieldLabel(response.formId, key)}:
                                                </span>
                                                <span className="ml-2 text-gray-900">
                                                    {Array.isArray(value) ? value.join(', ') : value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No responses submitted yet</p>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SchoolDetailPage;
