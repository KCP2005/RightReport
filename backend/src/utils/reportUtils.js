import * as math from 'mathjs';

/**
 * Analyzes a form field to determine its data type and suggested visualizations
 * @param {Object} field - The form field definition
 * @returns {Object} Analysis result with detected type and chart suggestions
 */
const analyzeFieldType = (field) => {
    const result = {
        fieldId: field.fieldId,
        fieldLabel: field.fieldLabel,
        originalType: field.fieldType,
        detectedDataType: 'text', // default
        suggestedCharts: [],
        isAggregatable: false
    };

    // Map form element types to data categories
    switch (field.fieldType) {
        case 'number':
        case 'range':
        case 'rating':
            result.detectedDataType = 'numeric';
            result.suggestedCharts = ['bar', 'line', 'area', 'gauge', 'heatmap'];
            result.isAggregatable = true;
            break;

        case 'select':
        case 'radio':
        case 'checkbox':
        case 'dropdown':
            result.detectedDataType = 'categorical';
            result.suggestedCharts = ['pie', 'donut', 'bar'];
            result.isAggregatable = true;
            break;

        case 'date':
        case 'time':
        case 'datetime':
            result.detectedDataType = 'date';
            result.suggestedCharts = ['timeline', 'line', 'area'];
            result.isAggregatable = true;
            break;

        case 'boolean':
        case 'toggle':
        case 'switch':
            result.detectedDataType = 'boolean';
            result.suggestedCharts = ['pie', 'gauge'];
            result.isAggregatable = true;
            break;

        case 'text':
        case 'textarea':
        case 'email':
        case 'tel':
        case 'url':
            result.detectedDataType = 'text';
            result.suggestedCharts = []; // Text usually doesn't have standard charts
            result.isAggregatable = false;
            break;

        default:
            // Attempt to infer from type name or label if standard type mapping fails
            if (['score', 'count', 'amount', 'total'].some(k => field.fieldLabel && field.fieldLabel.toLowerCase().includes(k))) {
                result.detectedDataType = 'numeric';
                result.suggestedCharts = ['bar', 'line'];
                result.isAggregatable = true;
            }
            break;
    }

    return result;
};

/**
 * Aggregates data for a specific field based on its type
 * @param {Array} responses - Array of response objects
 * @param {Object} field - The field definition
 * @param {string} groupBy - Grouping content ('district', 'taluka', 'school', or null)
 * @returns {Object} Aggregated data suitable for visualization
 */
const aggregateData = (responses, field, groupBy = 'none') => {
    const analysis = analyzeFieldType(field);
    const result = {
        fieldId: field.fieldId,
        fieldLabel: field.fieldLabel,
        dataType: analysis.detectedDataType,
        data: []
    };

    if (!analysis.isAggregatable) {
        return result;
    }

    // Prepare data extraction helper
    const getValue = (schema) => schema.responses[field.fieldId];

    // Grouping Logic
    const groups = {};

    responses.forEach(response => {
        let groupKey = 'Overall';
        if (groupBy === 'district') groupKey = response.districtName || 'Unknown';
        else if (groupBy === 'taluka') groupKey = response.talukaName || 'Unknown';
        else if (groupBy === 'school') groupKey = response.schoolName || 'Unknown';

        let value = getValue(response);

        // Skip null/undefined values
        if (value === undefined || value === null || value === '') return;

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(value);
    });

    // Aggregation Logic based on Type
    Object.keys(groups).forEach(key => {
        const values = groups[key];
        const groupStats = { label: key };

        if (analysis.detectedDataType === 'numeric') {
            // Convert strings to numbers if necessary
            const numericValues = values.map(v => Number(v)).filter(n => !isNaN(n));

            if (numericValues.length > 0) {
                groupStats.count = numericValues.length;
                groupStats.sum = math.sum(numericValues);
                groupStats.avg = math.mean(numericValues);
                groupStats.min = math.min(numericValues);
                groupStats.max = math.max(numericValues);
                groupStats.median = math.median(numericValues);
                groupStats.stdDev = math.std(numericValues);
                groupStats.value = groupStats.avg; // Default value for charts
            } else {
                groupStats.value = 0;
            }

        } else if (analysis.detectedDataType === 'categorical' || analysis.detectedDataType === 'boolean') {
            // Count occurrences
            const counts = {};
            let total = 0;

            values.forEach(val => {
                // Handle multi-select arrays
                const items = Array.isArray(val) ? val : [val];
                items.forEach(item => {
                    const strVal = String(item).trim();
                    counts[strVal] = (counts[strVal] || 0) + 1;
                    total++;
                });
            });

            // Convert to array format for Recharts
            groupStats.breakdown = Object.keys(counts).map(k => ({
                name: k,
                value: counts[k],
                percentage: ((counts[k] / total) * 100).toFixed(1)
            }));

            // For the main chart value, maybe return the most frequent count or total
            groupStats.value = total;
            groupStats.mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
        } else if (analysis.detectedDataType === 'date') {
            // Simple date grouping (e.g., by month) could go here
            // For now, just count submissions
            groupStats.count = values.length;
            groupStats.value = values.length;
        }

        result.data.push(groupStats);
    });

    return result;
};

/**
 * Generates text insights from aggregated data
 * @param {Object} aggregated - The output from aggregateData
 * @returns {Object} Summary, key findings, and stats
 */
const generateInsights = (aggregated) => {
    const { dataType, data, fieldLabel } = aggregated;
    const insights = {
        summary: '',
        keyFindings: [],
        statistics: {}
    };

    if (!data || data.length === 0) {
        insights.summary = 'No data available for analysis.';
        return insights;
    }

    if (dataType === 'numeric') {
        const globalValues = data.map(d => d.value);
        const overallAvg = math.mean(globalValues).toFixed(2);
        const highest = data.reduce((prev, current) => (prev.value > current.value) ? prev : current);
        const lowest = data.reduce((prev, current) => (prev.value < current.value) ? prev : current);

        insights.summary = `The average ${fieldLabel.toLowerCase()} is ${overallAvg}.`;
        insights.statistics = { mean: overallAvg, max: highest.value, min: lowest.value };

        insights.keyFindings.push(`Highest value recorded in ${highest.label} (${highest.value.toFixed(2)}).`);
        insights.keyFindings.push(`Lowest value recorded in ${lowest.label} (${lowest.value.toFixed(2)}).`);

        if (data.length > 2) {
            const stdDev = math.std(globalValues);
            if (stdDev > overallAvg * 0.2) {
                insights.keyFindings.push('Significant variation observed across groups.');
            } else {
                insights.keyFindings.push('Values are relatively consistent across groups.');
            }
        }

    } else if (dataType === 'categorical') {
        // Aggregate breakdown across all groups if groups exist, or just take the first if 'Overall'
        let overallCounts = {};

        data.forEach(group => {
            if (group.breakdown) {
                group.breakdown.forEach(item => {
                    overallCounts[item.name] = (overallCounts[item.name] || 0) + item.value;
                });
            }
        });

        const sortedOptions = Object.entries(overallCounts)
            .sort(([, a], [, b]) => b - a);

        const total = Object.values(overallCounts).reduce((a, b) => a + b, 0);
        const topOption = sortedOptions[0];

        if (topOption) {
            const pct = ((topOption[1] / total) * 100).toFixed(1);
            insights.summary = `The most common response is "${topOption[0]}" (${pct}%).`;
            insights.keyFindings.push(`"${topOption[0]}" dominates with ${topOption[1]} selections.`);

            if (sortedOptions.length > 1) {
                const secondPct = ((sortedOptions[1][1] / total) * 100).toFixed(1);
                insights.keyFindings.push(`"${sortedOptions[1][0]}" is the second most popular choice (${secondPct}%).`);
            }
        }
    }

    return insights;
};

/**
 * Generates comparison insights between groups
 * @param {Object} aggregated - Aggregated data dict
 * @returns {Object} Comparison insights (winner, diff, percentage)
 */
const generateComparisonInsights = (aggregated) => {
    const { data, fieldLabel, dataType } = aggregated;
    const insights = [];

    if (data.length < 2) return insights;

    // Sort by value (descending)
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const winner = sorted[0];
    const runnerUp = sorted[1];

    if (dataType === 'numeric') {
        const diff = winner.value - runnerUp.value;
        const pctDiff = ((diff / runnerUp.value) * 100).toFixed(1);

        insights.push(`${winner.label} is higher than ${runnerUp.label} by ${diff.toFixed(2)} (${pctDiff}%).`);

    } else if (dataType === 'categorical') {
        // Compare top choice percentages
        // Assuming 'value' here represents the count or a score
        insights.push(`${winner.label} has more responses (${winner.value}) than ${runnerUp.label} (${runnerUp.value}).`);
    }

    return insights;
};

export {
    analyzeFieldType,
    aggregateData,
    generateInsights,
    generateComparisonInsights
};
