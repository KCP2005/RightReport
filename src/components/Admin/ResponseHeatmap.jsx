import React, { useState, useEffect } from 'react';
import { formAPI, responseAPI } from '../../utils/api';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#8889DD', '#9597E4', '#8DC77B', '#A5D297', '#E2CF45', '#F8C12D'];

const CustomContent = (props) => {
    const { root, depth, x, y, width, height, index, name, value, colors } = props;

    return (
        <g>
            {/* Rectangle */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6)] : 'none',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {/* Text Label - Only shows if box is big enough */}
            {depth === 1 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                >
                    {width > 50 && height > 30 ? name : ''}
                </text>
            ) : null}

            {depth === 1 ? (
                <text
                    x={x + 4}
                    y={y + 18}
                    fill="#fff"
                    fontSize={16}
                    fillOpacity={0.9}
                >
                </text>
            ) : null}
        </g>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-md rounded-lg">
                <p className="font-bold text-gray-900">{payload[0].payload.name}</p>
                <p className="text-gray-600">Responses: {payload[0].value}</p>
            </div>
        );
    }
    return null;
};

const ResponseHeatmap = () => {
    const [forms, setForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState('');
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const res = await formAPI.listForms();
            setForms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedForm) {
            alert('Please select a form');
            return;
        }

        setLoading(true);
        try {
            // Fetch raw responses to manually aggregate for Treemap
            // Ideally backend should do this, but for now we aggregate client-side to save API dev time
            const res = await responseAPI.listResponses({ formId: selectedForm });
            const responses = res.data || [];

            // Transform to Treemap format:
            // { name: 'Root', children: [ { name: 'District', children: [ { name: 'Taluka', size: 10 } ] } ] }

            const groupMap = {};

            responses.forEach(r => {
                const dist = r.districtName;
                const taluka = r.talukaName;

                if (!groupMap[dist]) {
                    groupMap[dist] = {};
                }
                if (!groupMap[dist][taluka]) {
                    groupMap[dist][taluka] = 0;
                }
                groupMap[dist][taluka]++;
            });

            const children = Object.keys(groupMap).map(dist => {
                return {
                    name: dist,
                    children: Object.keys(groupMap[dist]).map(taluka => ({
                        name: taluka,
                        size: groupMap[dist][taluka]
                    }))
                };
            });

            setTreeData(children);

        } catch (err) {
            console.error(err);
            alert('Failed to load heatmap data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Response Density Map</h2>

            <div className="flex gap-4 mb-8 items-end">
                <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Form</label>
                    <select
                        value={selectedForm}
                        onChange={e => setSelectedForm(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Choose Form</option>
                        {forms.map(f => <option key={f.formId} value={f.formId}>{f.formTitle}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                    {loading ? 'Analyzing...' : 'Visualize'}
                </button>
            </div>

            <div className="h-[500px] w-full border border-gray-100 rounded-xl bg-gray-50 overflow-hidden">
                {treeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={treeData}
                            dataKey="size"
                            ratio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomContent colors={COLORS} />}
                        >
                            <Tooltip content={<CustomTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        {loading ? 'Processing data...' : 'Select a form to view response density'}
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
                * View aggregated response counts by District and Taluka. Larger boxes indicate more responses.
            </p>
        </div>
    );
};

export default ResponseHeatmap;
