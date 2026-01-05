import { useState, useRef } from 'react';
import { schoolAPI } from '../../utils/api';

function SchoolImport({ onImportComplete }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            alert('Please upload an Excel (.xlsx, .xls) or CSV file');
            return;
        }

        setFile(selectedFile);
        setResult(null);
        // In a real implementation, you would parse the file here to show preview
        setPreview({
            fileName: selectedFile.name,
            fileSize: (selectedFile.size / 1024).toFixed(2) + ' KB',
            rows: 'Parsing...',
        });
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await schoolAPI.importSchools(formData);
            setResult(response.data.results);
            setFile(null);
            setPreview(null);
            if (onImportComplete) onImportComplete();
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import schools. Please check the file format.');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        // Create a sample CSV template
        const headers = ['UDISE Code', 'School Name', 'District Name', 'Taluka Name', 'HOD Name', 'HOD Phone'];
        const sampleRow = ['12345678901', 'Sample School', 'Sample District', 'Sample Taluka', 'John Doe', '9876543210'];

        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'school_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Schools from Excel</h2>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Download the template and fill in your school data</li>
                        <li>• Required columns: UDISE Code, School Name, District Name, Taluka Name, HOD Name, HOD Phone</li>
                        <li>• UDISE Code must be unique (11 digits)</li>
                        <li>• Upload the completed Excel or CSV file</li>
                    </ul>
                </div>

                {/* Download Template */}
                <div className="mb-6">
                    <button onClick={downloadTemplate} className="btn btn-secondary">
                        📥 Download Template
                    </button>
                </div>

                {/* File Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        className="hidden"
                    />

                    {!file ? (
                        <>
                            <div className="text-6xl mb-4">📤</div>
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Drag and drop your file here
                            </p>
                            <p className="text-sm text-gray-600 mb-4">or</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-primary"
                            >
                                Browse Files
                            </button>
                            <p className="text-xs text-gray-500 mt-4">Supported formats: .xlsx, .xls, .csv</p>
                        </>
                    ) : (
                        <div>
                            <div className="text-6xl mb-4">📄</div>
                            <p className="font-medium text-gray-900">{preview?.fileName}</p>
                            <p className="text-sm text-gray-600">{preview?.fileSize}</p>
                            <div className="flex gap-3 justify-center mt-4">
                                <button onClick={handleImport} disabled={importing} className="btn btn-primary">
                                    {importing ? 'Importing...' : 'Import Schools'}
                                </button>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setPreview(null);
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Import Results */}
                {result && (
                    <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-4">Import Results</h3>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{result.success || 0}</p>
                                <p className="text-sm text-gray-600">Imported</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-yellow-600">{result.duplicates || 0}</p>
                                <p className="text-sm text-gray-600">Duplicates</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">{result.errors || 0}</p>
                                <p className="text-sm text-gray-600">Errors</p>
                            </div>
                        </div>

                        {/* Error Details */}
                        {result.errorDetails && result.errorDetails.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-red-900 mb-3">Error Details:</h4>
                                <div className="bg-white rounded-lg border border-red-200 max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-red-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Row</th>
                                                <th className="px-4 py-2 text-left">UDISE Code</th>
                                                <th className="px-4 py-2 text-left">Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errorDetails.map((error, idx) => (
                                                <tr key={idx} className="border-t border-gray-200">
                                                    <td className="px-4 py-2 font-medium">{error.row}</td>
                                                    <td className="px-4 py-2">{error.udiseCode}</td>
                                                    <td className="px-4 py-2 text-red-600">{error.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-blue-900 mb-2">📋 Common Issues:</h5>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• <strong>UDISE Code</strong> must be exactly 11 digits (e.g., 12345678901)</li>
                                        <li>• <strong>HOD Phone</strong> must be exactly 10 digits (e.g., 9876543210)</li>
                                        <li>• All fields are required: UDISE Code, School Name, District Name, Taluka Name, HOD Name, HOD Phone</li>
                                        <li>• Make sure there are no extra spaces or special characters</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SchoolImport;
