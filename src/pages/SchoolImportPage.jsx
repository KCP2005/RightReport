import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SchoolImport from '../components/Admin/SchoolImport';

function SchoolImportPage() {
    const { admin } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('import');
    const [manualForm, setManualForm] = useState({
        udiseCode: '',
        schoolName: '',
        districtName: '',
        talukaName: '',
        hodName: '',
        hodPhone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!admin) {
            navigate('/admin/login');
        }
    }, [admin, navigate]);

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Basic client-side validation
        if (!/^\d{11}$/.test(manualForm.udiseCode)) {
            setError('UDISE Code must be exactly 11 digits');
            setLoading(false);
            return;
        }
        if (!/^\d{10}$/.test(manualForm.hodPhone)) {
            setError('HOD Phone must be exactly 10 digits');
            setLoading(false);
            return;
        }

        try {
            // Dynamically import schoolAPI to avoid circular dependency issues if any, though here standard import works
            const { schoolAPI } = await import('../utils/api');
            await schoolAPI.createSchool(manualForm);
            setSuccess('School created successfully!');
            setManualForm({
                udiseCode: '',
                schoolName: '',
                districtName: '',
                talukaName: '',
                hodName: '',
                hodPhone: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create school');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setManualForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Schools</h1>
                    <p className="text-sm text-gray-600">Import schools or add them manually</p>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'import'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Bulk Import (Excel)
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'manual'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Manual Entry
                    </button>
                </nav>
            </div>

            {activeTab === 'import' ? (
                <SchoolImport onImportComplete={() => alert('Schools imported successfully!')} />
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New School</h2>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <span className="text-xl">✅</span> {success}
                        </div>
                    )}

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">UDISE Code *</label>
                                <input
                                    type="text"
                                    name="udiseCode"
                                    value={manualForm.udiseCode}
                                    onChange={handleInputChange}
                                    maxLength={11}
                                    className="form-input"
                                    placeholder="11-digit code"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">School Name *</label>
                                <input
                                    type="text"
                                    name="schoolName"
                                    value={manualForm.schoolName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Full school name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">District Name *</label>
                                <input
                                    type="text"
                                    name="districtName"
                                    value={manualForm.districtName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="e.g. Pune"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Taluka Name *</label>
                                <input
                                    type="text"
                                    name="talukaName"
                                    value={manualForm.talukaName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="e.g. Haveli"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">HOD Name *</label>
                                <input
                                    type="text"
                                    name="hodName"
                                    value={manualForm.hodName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Head of Department"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">HOD Phone *</label>
                                <input
                                    type="tel"
                                    name="hodPhone"
                                    value={manualForm.hodPhone}
                                    onChange={handleInputChange}
                                    maxLength={10}
                                    className="form-input"
                                    placeholder="10-digit mobile"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary flex justify-center items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {loading ? 'Creating School...' : 'Create School'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default SchoolImportPage;
