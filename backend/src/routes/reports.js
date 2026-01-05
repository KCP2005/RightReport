import express from 'express';
const router = express.Router();
import { authMiddleware } from '../middleware/auth.js';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import { analyzeFieldType, aggregateData, generateInsights } from '../utils/reportUtils.js';

// @route   POST /api/admin/reports/analyze-form
// @desc    Analyze form fields and suggest charts
// @access  Private (Admin)
router.post('/admin/reports/analyze-form', authMiddleware, async (req, res) => {
    try {
        const { formId } = req.body;
        const form = await Form.findOne({ formId });

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        const analysis = form.fields.map(field => analyzeFieldType(field));
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing form:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/reports/generate
// @desc    Generate full report data for a form
// @access  Private (Admin)
router.post('/admin/reports/generate', authMiddleware, async (req, res) => {
    try {
        const {
            formId,
            filters = {},
            groupBy = 'none',
            includeCharts = true
        } = req.body;

        // 1. Fetch Form
        const form = await Form.findOne({ formId });
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        // 2. Build Query based on filters
        const query = { formId };

        // Add date range filter
        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
            query.submittedAt = {
                $gte: new Date(filters.dateRange.start),
                $lte: new Date(filters.dateRange.end)
            };
        }

        // Add location filters (using $in for arrays)
        if (filters.districts && filters.districts.length > 0) {
            query.districtName = { $in: filters.districts };
        }
        if (filters.talukas && filters.talukas.length > 0) {
            query.talukaName = { $in: filters.talukas };
        }
        if (filters.schools && filters.schools.length > 0) {
            query.schoolName = { $in: filters.schools };
        }

        // 3. Fetch Responses
        const responses = await Response.find(query);

        // 4. Generate Report Data
        const reportData = {
            reportId: `REP-${Date.now()}`,
            generatedAt: new Date(),
            formTitle: form.formTitle,
            responseCount: responses.length,
            appliedFilters: filters,
            visualizations: [],
            summary: {
                overview: `Analysis of ${responses.length} responses for ${form.formTitle}.`,
                keyFindings: []
            }
        };

        if (includeCharts) {
            // Loop through fields and generate visual data
            form.fields.forEach(field => {
                const analysis = analyzeFieldType(field);

                if (analysis.isAggregatable) {
                    const aggregated = aggregateData(responses, field, groupBy);
                    const insights = generateInsights(aggregated);

                    if (aggregated.data.length > 0) {
                        reportData.visualizations.push({
                            fieldId: field.fieldId,
                            fieldLabel: field.fieldLabel,
                            chartType: analysis.suggestedCharts[0] || 'bar',
                            data: aggregated.data,
                            insights: insights
                        });

                        // Collect key findings for executive summary
                        if (insights.keyFindings.length > 0) {
                            reportData.summary.keyFindings.push(...insights.keyFindings);
                        }
                    }
                }
            });
        }

        // Add raw data (limit for safety if needed, or implement separate export)
        // reportData.rawData = responses; 

        res.json(reportData);



    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/reports/compare
// @desc    Compare data between specific entities
// @access  Private (Admin)
router.post('/admin/reports/compare', authMiddleware, async (req, res) => {
    try {
        const { formId, compareBy, entities } = req.body; // entities: ['DistrictA', 'DistrictB']

        const form = await Form.findOne({ formId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        // Build query to fetch only these entities
        const query = { formId };
        if (compareBy === 'district') query.districtName = { $in: entities };
        else if (compareBy === 'taluka') query.talukaName = { $in: entities };
        else if (compareBy === 'school') query.schoolName = { $in: entities };

        const responses = await Response.find(query);

        const comparisonData = {
            title: `Comparison: ${entities.join(' vs ')}`,
            generatedAt: new Date(),
            fields: []
        };

        const { analyzeFieldType, aggregateData, generateComparisonInsights } = await import('../utils/reportUtils.js');

        form.fields.forEach(field => {
            const analysis = analyzeFieldType(field);
            if (analysis.isAggregatable) {
                const aggregated = aggregateData(responses, field, compareBy);
                // Filter aggregation to only include requested entities (in case of partial matches or leftovers)
                aggregated.data = aggregated.data.filter(d => entities.includes(d.label));

                if (aggregated.data.length > 0) {
                    const compareInsights = generateComparisonInsights(aggregated);
                    comparisonData.fields.push({
                        fieldLabel: field.label,
                        chartType: analysis.suggestedCharts[0],
                        data: aggregated.data,
                        insights: compareInsights
                    });
                }
            }
        });

        res.json(comparisonData);

    } catch (error) {
        console.error('Error comparing reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
