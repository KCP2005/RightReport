import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

function AnalyticsCharts({ districtData, talukaData, trendsData }) {
    const [chartType, setChartType] = useState('bar');

    // Prepare data for pie chart
    const pieData = districtData?.slice(0, 6).map((item, index) => ({
        name: item.name,
        value: item.responseCount || 0,
    })) || [];

    return (
        <div className="space-y-6">
            {/* Chart Type Selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${chartType === 'bar'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    📊 Bar Chart
                </button>
                <button
                    onClick={() => setChartType('line')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${chartType === 'line'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    📈 Line Chart
                </button>
                <button
                    onClick={() => setChartType('pie')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${chartType === 'pie'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    🥧 Pie Chart
                </button>
            </div>

            {/* District-wise Bar Chart */}
            {chartType === 'bar' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">District-wise Response Count</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={districtData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="schoolCount" fill="#3b82f6" name="Schools" />
                            <Bar dataKey="responseCount" fill="#8b5cf6" name="Responses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Trends Line Chart */}
            {chartType === 'line' && trendsData && trendsData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Trends Over Time</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={trendsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="responses" stroke="#3b82f6" strokeWidth={2} name="Responses" />
                            <Line type="monotone" dataKey="schools" stroke="#10b981" strokeWidth={2} name="Active Schools" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Completion Rate Pie Chart */}
            {chartType === 'pie' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Distribution by District</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Taluka-wise Comparison */}
            {talukaData && talukaData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Talukas by Response Count</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={talukaData.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="responseCount" fill="#ec4899" name="Responses" />
                            <Bar dataKey="completionRate" fill="#f59e0b" name="Completion %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default AnalyticsCharts;
