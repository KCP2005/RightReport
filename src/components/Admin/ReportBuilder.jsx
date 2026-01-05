import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formAPI, schoolAPI, reportAPI } from '../../utils/api';
import VisualizationRenderer from './VisualizationRenderer';
import ComparisonReport from './ComparisonReport';
import ResponseHeatmap from './ResponseHeatmap';
import ResponseTable from './ResponseTable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';

const ReportBuilder = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL or defaults
    const initialTab = searchParams.get('tab') || 'standard';
    const initialForm = searchParams.get('formId') || '';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [forms, setForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState(initialForm);
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);

    // Filters
    const [selectedDistricts, setSelectedDistricts] = useState([]);
    const [selectedTalukas, setSelectedTalukas] = useState([]);
    const [groupBy, setGroupBy] = useState('none');

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Sync state to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (activeTab) params.set('tab', activeTab);
        if (selectedForm) params.set('formId', selectedForm);
        else params.delete('formId');

        setSearchParams(params, { replace: true });
    }, [activeTab, selectedForm]);

    // Update state if URL changes (e.g. back button)
    useEffect(() => {
        const t = searchParams.get('tab') || 'standard';
        const f = searchParams.get('formId') || '';
        if (t !== activeTab) setActiveTab(t);
        if (f !== selectedForm) setSelectedForm(f);
    }, [searchParams]);

    const loadInitialData = async () => {
        try {
            const [formsRes, schoolsRes] = await Promise.all([
                formAPI.listForms(),
                schoolAPI.getAllSchools()
            ]);
            setForms(formsRes.data);

            // Extract unique districts from schools
            const uniqueDistricts = [...new Set(schoolsRes.data.map(s => s.districtName))];
            setDistricts(uniqueDistricts);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedForm) {
            alert('Please select a form');
            return;
        }

        try {
            setLoading(true);
            const response = await reportAPI.generateReport({
                formId: selectedForm,
                groupBy,
                filters: {
                    districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
                    talukas: selectedTalukas.length > 0 ? selectedTalukas : undefined
                }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = async () => {
        const input = document.getElementById('report-content');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`report-${selectedForm}.pdf`);
        } catch (err) {
            console.error('PDF Export failed:', err);
        }
    };

    const exportExcel = () => {
        if (!reportData) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Summary
        const summaryData = [
            ['Report Title', reportData.formTitle],
            ['Generated On', new Date(reportData.generatedAt).toLocaleDateString()],
            ['Total Responses', reportData.responseCount],
            [],
            ['Executive Summary'],
            [reportData.summary.overview],
            [],
            ['Key Findings'],
            ...reportData.summary.keyFindings.map(f => [f])
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // Sheet 2: Data Aggregations
        reportData.visualizations.forEach(viz => {
            const sheetName = viz.fieldLabel.substring(0, 30).replace(/[\\/?*[\]]/g, ""); // Sanitize sheet name
            const rows = [['Label', 'Value', 'Count', 'Percentage']];

            viz.data.forEach(d => {
                // Flatten data if breakdown exists (categorical)
                if (d.breakdown) {
                    d.breakdown.forEach(item => {
                        rows.push([item.name, item.value, item.value, item.percentage + '%']);
                    });
                } else {
                    rows.push([d.label, d.value, d.count || '-', '-']);
                }
            });

            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        XLSX.writeFile(wb, `report-${selectedForm}.xlsx`);
    };

    const exportPPT = async () => {
        if (!reportData) return;

        const pptx = new PptxGenJS();

        // Slide 1: Title
        let slide = pptx.addSlide();
        slide.addText(reportData.formTitle, { x: 1, y: 1, w: 8, h: 1, fontSize: 36, bold: true, align: 'center' });
        slide.addText(`Generated on: ${new Date(reportData.generatedAt).toLocaleDateString()}`, { x: 1, y: 3, w: 8, h: 0.5, fontSize: 18, align: 'center', color: '666666' });
        slide.addText(`${reportData.responseCount} Responses Analyzed`, { x: 1, y: 4, w: 8, h: 0.5, fontSize: 18, align: 'center', color: '666666' });

        // Slide 2: Executive Summary
        slide = pptx.addSlide();
        slide.addText("Executive Summary", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '003366' });
        slide.addText(reportData.summary.overview, { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 14 });

        if (reportData.summary.keyFindings.length > 0) {
            slide.addText("Key Findings", { x: 0.5, y: 3, fontSize: 18, bold: true, color: '003366' });
            const findings = reportData.summary.keyFindings.map(f => ({ text: f, options: { fontSize: 14, bullet: true } }));
            slide.addText(findings, { x: 0.5, y: 3.5, w: 9, h: 2 });
        }

        reportData.visualizations.forEach(viz => {
            slide = pptx.addSlide();
            slide.addText(viz.fieldLabel, { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: '003366' });

            // Add Insights
            if (viz.insights) {
                slide.addText(viz.insights.summary, { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 12, italic: true });
            }

            // Create simple table for data
            const rows = [['Label', 'Value/Count']];
            viz.data.slice(0, 8).forEach(d => { // limit rows for slide
                if (d.breakdown) {
                    d.breakdown.slice(0, 5).forEach(b => rows.push([b.name, b.value]));
                } else {
                    rows.push([d.label, d.value]);
                }
            });

            slide.addTable(rows, { x: 0.5, y: 2, w: 5, colW: [2.5, 2.5], border: { type: 'solid', color: '003366' } });

            // Add stats if available
            if (viz.insights && viz.insights.statistics) {
                const statsObj = viz.insights.statistics;
                const statText = Object.entries(statsObj).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('  |  ');
                slide.addText(statText, { x: 0.5, y: 5, w: 9, h: 0.5, fontSize: 10, color: '666666' });
            }
        });

        pptx.writeFile({ fileName: `report-${selectedForm}.pptx` });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Report Builder</h1>
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setActiveTab('standard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Standard Report
                    </button>
                    <button
                        onClick={() => setActiveTab('compare')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'compare' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Comparison
                    </button>
                    <button
                        onClick={() => setActiveTab('heatmap')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'heatmap' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Density Map
                    </button>
                    <button
                        onClick={() => setActiveTab('responses')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'responses' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Responses
                    </button>
                </div>
            </div>

            {activeTab === 'compare' ? (
                <ComparisonReport />
            ) : activeTab === 'heatmap' ? (
                <ResponseHeatmap />
            ) : activeTab === 'responses' ? (
                <ResponseTable
                    form={forms.find(f => f.formId === selectedForm)}
                    forms={forms}
                />
            ) : (
                <>
                    {/* Standard Report Content */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Form</label>
                                <select
                                    value={selectedForm}
                                    onChange={(e) => setSelectedForm(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">-- Choose a Form --</option>
                                    {forms.map(f => (
                                        <option key={f.formId} value={f.formId}>{f.formTitle}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                                <select
                                    value={groupBy}
                                    onChange={(e) => setGroupBy(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="none">None (Overall)</option>
                                    <option value="district">District</option>
                                    <option value="taluka">Taluka</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {loading ? 'Generating...' : 'Generate Report'}
                                </button>
                            </div>
                        </div>

                        {/* Filters Expansion */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-700 mb-2">Filter by District</p>
                            <div className="flex flex-wrap gap-2">
                                {districts.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setSelectedDistricts(prev =>
                                            prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                                        )}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${selectedDistricts.includes(d)
                                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {reportData && (
                        <div id="report-content" className="bg-white rounded-xl shadow-lg p-8">
                            <div className="flex justify-between items-start mb-8 border-b pb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">{reportData.formTitle} Analysis</h2>
                                    <p className="text-gray-500 mt-1">Generated on {new Date(reportData.generatedAt).toLocaleDateString()}</p>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Analyzing {reportData.responseCount} responses
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={exportPDF} className="btn btn-outline btn-sm">⬇ Download PDF</button>
                                    <button onClick={exportExcel} className="btn btn-outline btn-sm">📊 Excel</button>
                                    <button onClick={exportPPT} className="btn btn-outline btn-sm">📽️ PPT</button>
                                </div>
                            </div>

                            <div className="mb-10 bg-gray-50 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h3>
                                <p className="text-gray-700 mb-4">{reportData.summary.overview}</p>

                                {reportData.summary.keyFindings.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-2">Key Findings:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            {reportData.summary.keyFindings.map((finding, i) => (
                                                <li key={i}>{finding}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {reportData.visualizations.map((viz) => (
                                    <VisualizationRenderer
                                        key={viz.fieldId}
                                        fieldLabel={viz.fieldLabel}
                                        chartType={viz.chartType}
                                        data={viz.data}
                                        insights={viz.insights}
                                    />
                                ))}
                            </div>

                            {reportData.visualizations.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No visualizable data found matching criteria.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportBuilder;
