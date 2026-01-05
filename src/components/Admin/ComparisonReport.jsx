import React, { useState, useEffect } from 'react';
import { formAPI, schoolAPI, reportAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ComparisonReport = () => {
    const [forms, setForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState('');
    const [compareBy, setCompareBy] = useState('district'); // district, taluka
    const [availableEntities, setAvailableEntities] = useState([]);
    const [entityA, setEntityA] = useState('');
    const [entityB, setEntityB] = useState('');

    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadForms();
    }, []);

    useEffect(() => {
        if (compareBy) {
            loadEntities();
        }
    }, [compareBy]);

    const loadForms = async () => {
        try {
            const res = await formAPI.listForms();
            setForms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadEntities = async () => {
        try {
            // Re-using schoolAPI to get districts/talukas
            // Ideally we should have a more generic 'entities' API, but this works
            let entities = [];
            if (compareBy === 'district') {
                const res = await schoolAPI.getDistricts();
                entities = res.data;
            } else {
                // For talukas, we ideally need ALL talukas, or maybe filter by a selected district first
                // For simplicity in comparison, let's fetch all schools and extract unique talukas
                const res = await schoolAPI.getAllSchools();
                entities = [...new Set(res.data.map(s => s.talukaName))];
            }
            setAvailableEntities(entities);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompare = async () => {
        if (!selectedForm || !entityA || !entityB) {
            alert("Please select a form and two entities to compare.");
            return;
        }

        setLoading(true);
        try {
            // Re-using reportAPI.generateReport typically, but we created a specific /compare endpoint
            // We need to add compare to api.js first
            // Wait, I haven't added reportAPI.compareReport to api.js yet. I'll do that next. 
            // Assuming it exists for now:
            const response = await reportAPI.compareReport({
                formId: selectedForm,
                compareBy,
                entities: [entityA, entityB]
            });
            setComparisonData(response.data);
        } catch (err) {
            console.error(err);
            alert("Comparison failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Side-by-Side Comparison</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
                    <select
                        value={selectedForm}
                        onChange={e => setSelectedForm(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select Form</option>
                        {forms.map(f => <option key={f.formId} value={f.formId}>{f.formTitle}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compare By</label>
                    <select
                        value={compareBy}
                        onChange={e => { setCompareBy(e.target.value); setEntityA(''); setEntityB(''); }}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="district">District</option>
                        <option value="taluka">Taluka</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity A</label>
                    <select
                        value={entityA}
                        onChange={e => setEntityA(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select First</option>
                        {availableEntities
                            .filter(e => e !== entityB)
                            .map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity B</label>
                    <select
                        value={entityB}
                        onChange={e => setEntityB(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select Second</option>
                        {availableEntities
                            .filter(e => e !== entityA)
                            .map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end mb-8">
                <button
                    onClick={handleCompare}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                    {loading ? 'Comparing...' : 'Run Comparison'}
                </button>
            </div>

            {comparisonData && (
                <div className="space-y-8">
                    <div className="border-b pb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{comparisonData.title}</h3>
                        <p className="text-gray-500">Generated on {new Date(comparisonData.generatedAt).toLocaleDateString()}</p>
                    </div>

                    {comparisonData.fields.map((field, idx) => (
                        <div key={idx} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold mb-4">{field.fieldLabel}</h4>

                            <div className="h-64 w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={field.data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#8884d8" name="Value" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {field.insights && field.insights.length > 0 && (
                                <div className="bg-white p-3 rounded border border-purple-100">
                                    <p className="text-purple-700 font-medium">💡 Insight:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700">
                                        {field.insights.map((ins, i) => <li key={i}>{ins}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComparisonReport;
