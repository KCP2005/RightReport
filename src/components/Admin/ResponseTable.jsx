import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { responseAPI, schoolAPI } from '../../utils/api';
import * as XLSX from 'xlsx';
import { Download, Search } from 'lucide-react';

const ResponseTable = ({ forms }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    // Init from URL or prop
    const initialFormId = searchParams.get('formId') || '';

    const [selectedFormId, setSelectedFormId] = useState(initialFormId);
    const [responses, setResponses] = useState([]);
    const [schools, setSchools] = useState({});
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        district: '',
        taluka: ''
    });

    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Derived form object
    const form = forms.find(f => f.formId === selectedFormId);

    // Sync local state to URL when changed (2-way binding)
    const handleFormChange = (newId) => {
        setSelectedFormId(newId);
        const params = new URLSearchParams(searchParams);
        if (newId) params.set('formId', newId);
        else params.delete('formId');
        setSearchParams(params, { replace: true });
    };

    // Listen for URL changes
    useEffect(() => {
        const fId = searchParams.get('formId') || '';
        if (fId !== selectedFormId) {
            setSelectedFormId(fId);
        }
    }, [searchParams]);

    useEffect(() => {
        if (form && selectedFormId) {
            loadInitialData();
        }
    }, [selectedFormId, form]);

    // Update talukas when district changes
    useEffect(() => {
        if (filters.district) {
            loadTalukas(filters.district);
        } else {
            setTalukas([]);
        }
    }, [filters.district]);

    // Debounce search/filter fetch
    useEffect(() => {
        if (selectedFormId) {
            const timer = setTimeout(() => {
                // Reset page on filter change
                setCurrentPage(1);
                fetchResponses();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedFormId, filters.district, filters.taluka, filters.search]);


    const loadInitialData = async () => {
        try {
            // Load districts for filter
            const distRes = await schoolAPI.getDistricts();
            setDistricts(distRes.data);

            // Load all schools for lookup map (HOD info etc)
            if (Object.keys(schools).length === 0) {
                const schoolRes = await schoolAPI.getAllSchools();
                const schoolMap = {};
                schoolRes.data.forEach(s => {
                    schoolMap[s.udiseCode] = s;
                });
                setSchools(schoolMap);
            }

        } catch (err) {
            console.error("Error loading metadata", err);
        }
    };

    const loadTalukas = async (dist) => {
        try {
            const res = await schoolAPI.getTalukas(dist);
            setTalukas(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchResponses = async () => {
        if (!selectedFormId) return;
        setLoading(true);
        try {
            const params = {
                formId: selectedFormId,
                district: filters.district || undefined,
                taluka: filters.taluka || undefined
            };

            const res = await responseAPI.listResponses(params);

            // Client-side filtering for search text
            let data = res.data;
            if (filters.search) {
                const q = filters.search.toLowerCase();
                data = data.filter(r =>
                    r.schoolName.toLowerCase().includes(q) ||
                    r.udiseCode.includes(q)
                );
            }

            setResponses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!responses.length) return;

        // Flatten data for export
        const exportData = responses.map(r => {
            const schoolInfo = schools[r.udiseCode] || {};
            const row = {
                'UDISE Code': r.udiseCode,
                'School Name': r.schoolName,
                'District': r.districtName,
                'Taluka': r.talukaName,
                'HOD Name': schoolInfo.hodName || '-',
                'HOD Phone': schoolInfo.hodPhone || '-',
                'Submitted By': r.submittedBy,
                'Submitted At': new Date(r.submittedAt).toLocaleDateString(),
            };

            // Add form fields
            form.fields.forEach(field => {
                const val = r.responses[field.fieldId];
                if (field.fieldType === 'file' && val && (val.url || val.driveLink)) {
                    row[field.fieldLabel] = val.url || val.driveLink;
                } else {
                    row[field.fieldLabel] = Array.isArray(val) ? val.join(', ') : val;
                }
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Responses");
        XLSX.writeFile(wb, `${form.formTitle}_Responses.xlsx`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Form</label>
                <select
                    value={selectedFormId}
                    onChange={e => handleFormChange(e.target.value)}
                    className="w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="">Choose Form</option>
                    {forms.map(f => <option key={f.formId} value={f.formId}>{f.formTitle}</option>)}
                </select>
            </div>

            {selectedFormId && form ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            Responses ({responses.length})
                        </h2>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            <Download size={18} /> Export Excel
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search School or UDISE..."
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={filters.district}
                            onChange={e => setFilters({ ...filters, district: e.target.value, taluka: '' })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">All Districts</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select
                            value={filters.taluka}
                            onChange={e => setFilters({ ...filters, taluka: e.target.value })}
                            disabled={!filters.district}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">All Talukas</option>
                            {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UDISE</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HOD Info</th>
                                    {form.fields.map(field => (
                                        <th key={field.fieldId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            {field.fieldLabel}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5 + form.fields.length} className="px-6 py-10 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : responses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5 + form.fields.length} className="px-6 py-10 text-center text-gray-500">
                                            No responses found matching filters.
                                        </td>
                                    </tr>
                                ) : (
                                    (() => {
                                        // Pagination Logic
                                        const indexOfLastItem = currentPage * itemsPerPage;
                                        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                                        const currentResponses = responses.slice(indexOfFirstItem, indexOfLastItem);

                                        return currentResponses.map((response, index) => {
                                            const school = schools[response.udiseCode] || {};
                                            return (
                                                <tr key={response.responseId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {response.udiseCode}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {response.schoolName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {response.talukaName}, {response.districtName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span>{school.hodName || '-'}</span>
                                                            <span className="text-xs text-gray-400">{school.hodPhone}</span>
                                                        </div>
                                                    </td>
                                                    {form.fields.map(field => {
                                                        const val = response.responses[field.fieldId];
                                                        let content = '-';

                                                        const fileLink = val?.url || val?.driveLink;
                                                        if (field.fieldType === 'file' && val && fileLink) {
                                                            content = (
                                                                <a
                                                                    href={fileLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                                    title={`Size: ${(val.compressedSize / 1024).toFixed(1)} KB`}
                                                                >
                                                                    📎 {val.fileName}
                                                                </a>
                                                            );
                                                        } else if (Array.isArray(val)) {
                                                            content = val.join(', ');
                                                        } else if (val !== undefined && val !== null) {
                                                            content = String(val);
                                                        }

                                                        return (
                                                            <td key={field.fieldId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {content}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(response.submittedAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {responses.length > itemsPerPage && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, responses.length)}</span> of <span className="font-medium">{responses.length}</span> results
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(responses.length / itemsPerPage)))}
                                    disabled={currentPage >= Math.ceil(responses.length / itemsPerPage)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center text-gray-400 py-10 border-t border-gray-100 mt-6">
                    Select a form to view its response data.
                </div>
            )}
        </div>
    );
};

// Pagination helper component or logic inline? Inline is easiest for now.
const ResponseTableWithPagination = (props) => {
    // We are inside the MAIN component logic in the replace instruction, so I'll just add the pagination logic to the end of the render
    // logic of the main component.
    // Wait, the ReplacementContent replaces specific lines.
    // I need to REPLACE the whole rendering of the table/pagination area or inject it.
    // Let's first add state at the top.

    return <ResponseTable {...props} />;
}
// IGNORE ABOVE, just thinking.

// I'll make two edits. 
// 1. Add state and logic at the top.
// 2. Add pagination UI at the bottom.


export default ResponseTable;
