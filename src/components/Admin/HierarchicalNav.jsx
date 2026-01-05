import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { schoolAPI, adminAPI } from '../../utils/api';

function HierarchicalNav() {
    const [view, setView] = useState('districts'); // districts, talukas, schools
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [schools, setSchools] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedTaluka, setSelectedTaluka] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});

    // Search and Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const getFilteredSchools = () => {
        if (!searchQuery) return schools;
        const lowerQuery = searchQuery.toLowerCase();
        return schools.filter(s =>
            s.schoolName?.toLowerCase().includes(lowerQuery) ||
            s.udiseCode?.includes(lowerQuery)
        );
    };

    const getCurrentSchools = () => {
        const filtered = getFilteredSchools();
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    useEffect(() => {
        const districtParam = searchParams.get('district');
        const talukaParam = searchParams.get('taluka');

        if (districtParam && talukaParam) {
            handleDeepLinkSchools(districtParam, talukaParam);
        } else if (districtParam) {
            handleDeepLinkTalukas(districtParam);
        } else {
            fetchDistricts();
        }
    }, [searchParams]);

    const handleDeepLinkSchools = async (district, taluka) => {
        setSelectedDistrict(district);
        setSelectedTaluka(taluka);
        setView('schools');
        setLoading(true);
        try {
            const response = await schoolAPI.getSchoolsByLocation(district, taluka);
            setSchools(response.data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeepLinkTalukas = async (district) => {
        setSelectedDistrict(district);
        setView('talukas');
        setLoading(true);
        try {
            const [talukasRes, statsRes] = await Promise.all([
                schoolAPI.getTalukas(district),
                adminAPI.getTalukaAnalytics(),
            ]);
            setTalukas(talukasRes.data || []);
            // Filter stats for selected district
            const districtStats = (statsRes.data || []).filter(s => s.district === district);
            const statsMap = {};
            districtStats.forEach(stat => {
                statsMap[stat.name] = stat;
            });
            setStats(statsMap);

        } catch (error) {
            console.error('Error fetching talukas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDistricts = async () => {
        try {
            setLoading(true);
            const [districtsRes, statsRes] = await Promise.all([
                schoolAPI.getDistricts(),
                adminAPI.getDistrictAnalytics(),
            ]);
            setDistricts(districtsRes.data || []);

            // Create stats map
            const statsMap = {};
            (statsRes.data || []).forEach(stat => {
                statsMap[stat.name] = stat;
            });
            setStats(statsMap);
        } catch (error) {
            console.error('Error fetching districts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDistrictClick = async (district) => {
        setSelectedDistrict(district);
        setView('talukas');
        setLoading(true);

        try {
            const [talukasRes, statsRes] = await Promise.all([
                schoolAPI.getTalukas(district),
                adminAPI.getTalukaAnalytics(),
            ]);
            setTalukas(talukasRes.data || []);

            // Filter stats for selected district
            const districtStats = (statsRes.data || []).filter(s => s.district === district);
            const statsMap = {};
            districtStats.forEach(stat => {
                statsMap[stat.name] = stat;
            });
            setStats(statsMap);
        } catch (error) {
            console.error('Error fetching talukas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTalukaClick = async (taluka) => {
        setSelectedTaluka(taluka);
        setView('schools');
        setLoading(true);

        try {
            const response = await schoolAPI.getSchoolsByLocation(selectedDistrict, taluka);
            setSchools(response.data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchoolClick = (udiseCode) => {
        navigate(`/admin/school/${udiseCode}`);
    };

    const handleBack = () => {
        if (view === 'schools') {
            setView('talukas');
            setSelectedTaluka(null);
        } else if (view === 'talukas') {
            setView('districts');
            setSelectedDistrict(null);
            fetchDistricts();
        }
    };

    const renderBreadcrumb = () => {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <button
                    onClick={() => {
                        setView('districts');
                        setSelectedDistrict(null);
                        setSelectedTaluka(null);
                        fetchDistricts();
                    }}
                    className="hover:text-blue-600"
                >
                    All Districts
                </button>
                {selectedDistrict && (
                    <>
                        <span>/</span>
                        <button
                            onClick={() => {
                                setView('talukas');
                                setSelectedTaluka(null);
                            }}
                            className="hover:text-blue-600"
                        >
                            {selectedDistrict}
                        </button>
                    </>
                )}
                {selectedTaluka && (
                    <>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">{selectedTaluka}</span>
                    </>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div>
            {renderBreadcrumb()}

            {/* Districts View */}
            {view === 'districts' && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Select District</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {districts.map((district) => (
                            <button
                                key={district}
                                onClick={() => handleDistrictClick(district)}
                                className="card text-left hover:border-blue-500 hover:shadow-lg transition-all"
                            >
                                <h3 className="font-semibold text-gray-900 mb-3">{district}</h3>
                                {stats[district] && (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Schools:</span>
                                            <span className="font-medium text-gray-900">{stats[district].schoolCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Responses:</span>
                                            <span className="font-medium text-gray-900">{stats[district].responseCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Completion:</span>
                                            <span className="font-medium text-blue-600">{stats[district].completionRate || 0}%</span>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Talukas View */}
            {view === 'talukas' && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Talukas in {selectedDistrict}</h2>
                        <button onClick={handleBack} className="btn btn-secondary btn-sm">
                            ← Back to Districts
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {talukas.map((taluka) => (
                            <button
                                key={taluka}
                                onClick={() => handleTalukaClick(taluka)}
                                className="card text-left hover:border-blue-500 hover:shadow-lg transition-all"
                            >
                                <h3 className="font-semibold text-gray-900 mb-3">{taluka}</h3>
                                {stats[taluka] && (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Schools:</span>
                                            <span className="font-medium text-gray-900">{stats[taluka].schoolCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Responses:</span>
                                            <span className="font-medium text-gray-900">{stats[taluka].responseCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Completion:</span>
                                            <span className="font-medium text-blue-600">{stats[taluka].completionRate || 0}%</span>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Schools View */}
            {view === 'schools' && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Schools in {selectedTaluka}, {selectedDistrict}
                        </h2>
                        <button onClick={handleBack} className="btn btn-secondary btn-sm">
                            ← Back to Talukas
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6 relative">
                        <input
                            type="text"
                            placeholder="Search by School Name or UDISE..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                        />
                        <svg
                            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {schools.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <p className="text-gray-600">No schools found in this taluka</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {getCurrentSchools().length > 0 ? (
                                    getCurrentSchools().map((school) => (
                                        <button
                                            key={school.udiseCode}
                                            onClick={() => handleSchoolClick(school.udiseCode)}
                                            className="w-full card text-left hover:border-blue-500 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-1">{school.schoolName}</h3>
                                                    <p className="text-sm text-gray-600">UDISE: {school.udiseCode}</p>
                                                    <p className="text-sm text-gray-600">HOD: {school.hodName} • {school.hodPhone}</p>
                                                </div>
                                                <span className="text-blue-500">→</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                        No schools match your search "{searchQuery}"
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {getFilteredSchools().length > 20 && (
                                <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(currentPage * 20, getFilteredSchools().length)}
                                        </span>{' '}
                                        of <span className="font-medium">{getFilteredSchools().length}</span> results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, Math.ceil(getFilteredSchools().length / 20)) }, (_, i) => {
                                                let p = i + 1;
                                                return null;
                                            })}
                                            <span className="text-sm font-medium px-2">
                                                Page {currentPage} of {Math.ceil(getFilteredSchools().length / 20)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(getFilteredSchools().length / 20), p + 1))}
                                            disabled={currentPage >= Math.ceil(getFilteredSchools().length / 20)}
                                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default HierarchicalNav;
