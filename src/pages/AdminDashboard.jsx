import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';
import AnalyticsCharts from '../components/Admin/AnalyticsCharts';

function AdminDashboard() {
    const [view, setView] = useState('district'); // district or taluka
    const [stats, setStats] = useState(null);
    const [districtData, setDistrictData] = useState([]);
    const [talukaData, setTalukaData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedTaluka, setSelectedTaluka] = useState(null);

    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!admin) {
            navigate('/admin/login');
            return;
        }
        fetchDashboardData();
    }, [admin, navigate]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, districtRes, talukaRes] = await Promise.all([
                adminAPI.getDashboardStats(),
                adminAPI.getDistrictAnalytics(),
                adminAPI.getTalukaAnalytics(),
            ]);

            setStats(statsRes.data);
            setDistrictData(districtRes.data || []);
            setTalukaData(talukaRes.data || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    // Derived data for drill-down
    const currentViewTitle = selectedTaluka
        ? `Schools in ${selectedTaluka}`
        : selectedDistrict
            ? `Talukas in ${selectedDistrict}`
            : 'All Districts';

    const displayedDistricts = districtData; // Always all districts at top level

    // Filter talukas by selected district
    const displayedTalukas = selectedDistrict
        ? talukaData.filter(t => t.district === selectedDistrict)
        : talukaData;

    const handleDistrictClick = (districtName) => {
        setSelectedDistrict(districtName);
        setView('taluka');
    };

    const handleTalukaClick = (talukaName) => {
        navigate(`/admin/navigation?district=${selectedDistrict || ''}&taluka=${talukaName}`);
    };

    const handleReset = () => {
        setSelectedDistrict(null);
        setSelectedTaluka(null);
        setView('district');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Schools</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.totalSchools || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🏫</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Forms</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.totalForms || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Responses</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.totalResponses || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                            <p className="text-3xl font-bold text-gray-900">{stats?.pendingRequests || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">⏳</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drill-down Header & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 mb-2">
                        <button onClick={handleReset} className="hover:text-blue-600 font-medium">Overview</button>
                        {selectedDistrict && (
                            <>
                                <span className="mx-2">/</span>
                                <span className="font-semibold text-gray-900">{selectedDistrict}</span>
                            </>
                        )}
                    </nav>
                    <h2 className="text-xl font-bold text-gray-900">{currentViewTitle}</h2>
                </div>

                {/* View Toggle (Only show if at top level) */}
                {!selectedDistrict && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('district')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'district'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Districts
                        </button>
                        <button
                            onClick={() => setView('taluka')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'taluka'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Talukas
                        </button>
                    </div>
                )}
            </div>

            {/* Content Grid */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                {view === 'district' && !selectedDistrict && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedDistricts.map((district, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleDistrictClick(district.name)}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-400 group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600">{district.name}</h3>
                                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">Select ➔</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Schools</span>
                                        <span className="font-medium">{district.schoolCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Completion</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${district.completionRate || 0}%` }}></div>
                                            </div>
                                            <span className="font-medium text-blue-600">{district.completionRate || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(view === 'taluka' || selectedDistrict) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedTalukas.length > 0 ? (
                            displayedTalukas.map((taluka, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleTalukaClick(taluka.name)}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-purple-400 group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600">{taluka.name}</h3>
                                        <span className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-full">View ➔</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{taluka.district}</p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Schools</span>
                                            <span className="font-medium">{taluka.schoolCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Avg. Forms</span>
                                            <span className="font-medium">{taluka.responseCount || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                <p>No talukas found for this selection.</p>
                                <button onClick={handleReset} className="text-blue-500 hover:underline mt-2">Go Back</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Analytics Charts */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Analytics</h2>
                <AnalyticsCharts districtData={districtData} talukaData={talukaData} />
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <button onClick={() => navigate('/admin/forms/builder')} className="card text-left hover:border-blue-500">
                        <div className="text-3xl mb-3">📝</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Create Form</h3>
                        <p className="text-sm text-gray-600">Build a new data collection form</p>
                    </button>

                    <button onClick={() => navigate('/admin/edit-requests')} className="card text-left hover:border-blue-500">
                        <div className="text-3xl mb-3">📊</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Edit Requests</h3>
                        <p className="text-sm text-gray-600">Review pending edit requests</p>
                    </button>

                    <button onClick={() => navigate('/admin/schools/import')} className="card text-left hover:border-blue-500">
                        <div className="text-3xl mb-3">📤</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Import Schools</h3>
                        <p className="text-sm text-gray-600">Upload school data from Excel</p>
                    </button>

                    <button onClick={() => navigate('/admin/navigation')} className="card text-left hover:border-blue-500">
                        <div className="text-3xl mb-3">🗺️</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Browse Schools</h3>
                        <p className="text-sm text-gray-600">Navigate by district and taluka</p>
                    </button>

                    <button onClick={() => navigate('/admin/reports')} className="card text-left hover:border-blue-500">
                        <div className="text-3xl mb-3">📑</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Generate Reports</h3>
                        <p className="text-sm text-gray-600">Export data to Excel/CSV/PDF</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
