import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const VisualizationRenderer = ({ fieldLabel, chartType, data, insights }) => {

    // Sort data for better visualization if categorical
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const renderChart = () => {
        switch (chartType) {
            case 'pie':
            case 'donut':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data[0]?.breakdown || data} // Use breakdown if available (categorical), else top-level
                                cx="50%"
                                cy="50%"
                                innerRadius={chartType === 'donut' ? 60 : 0}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {(data[0]?.breakdown || data).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'bar':
            default:
                // Check if we need a simple bar or grouped bar (categorical distribution per group)
                // For now, implementing simple bar of compiled values
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#0088FE" name="Average/Count" />
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{fieldLabel}</h3>

            <div className="mb-6">
                {renderChart()}
            </div>

            {insights && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">AI Insights</h4>
                    <p className="text-sm text-blue-800 mb-2">{insights.summary}</p>
                    <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                        {insights.keyFindings.map((finding, idx) => (
                            <li key={idx}>{finding}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Statistics Row */}
            {insights?.statistics && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                    {Object.entries(insights.statistics).map(([key, val]) => (
                        <div key={key} className="text-center">
                            <span className="block text-xs text-gray-500 uppercase">{key}</span>
                            <span className="block text-sm font-medium text-gray-900">{val}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VisualizationRenderer;
