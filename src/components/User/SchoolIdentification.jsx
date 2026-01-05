import { useState, useEffect } from 'react';
import { schoolAPI } from '../../utils/api';

function SchoolIdentification({ onSchoolIdentified }) {
    const [method, setMethod] = useState(() => localStorage.getItem('schoolMethod') || 'udise'); // udise or manual

    const handleMethodChange = (newMethod) => {
        setMethod(newMethod);
        localStorage.setItem('schoolMethod', newMethod);
    };
    const [udiseCode, setUdiseCode] = useState('');
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [schools, setSchools] = useState([]);

    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedTaluka, setSelectedTaluka] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
    const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch districts on component mount
    useEffect(() => {
        if (method === 'manual') {
            fetchDistricts();
        }
    }, [method]);

    const fetchDistricts = async () => {
        try {
            const response = await schoolAPI.getDistricts();
            setDistricts(response.data || []);
        } catch (err) {
            console.error('Error fetching districts:', err);
            setError('Failed to load districts');
        }
    };

    const handleDistrictChange = async (district) => {
        setSelectedDistrict(district);
        setSelectedTaluka('');
        setSelectedSchool('');
        setSchoolSearchTerm('');
        setTalukas([]);
        setSchools([]);

        if (district) {
            try {
                const response = await schoolAPI.getTalukas(district);
                setTalukas(response.data || []);
            } catch (err) {
                console.error('Error fetching talukas:', err);
                setError('Failed to load talukas');
            }
        }
    };

    const handleTalukaChange = async (taluka) => {
        setSelectedTaluka(taluka);
        setSelectedSchool('');
        setSchoolSearchTerm('');
        setSchools([]);

        if (taluka && selectedDistrict) {
            try {
                const response = await schoolAPI.searchByLocation(selectedDistrict, taluka);
                setSchools(response.data || []);
            } catch (err) {
                console.error('Error fetching schools:', err);
                setError('Failed to load schools');
            }
        }
    };

    const handleUdiseSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await schoolAPI.searchByUDISE(udiseCode);
            if (response.data) {
                onSchoolIdentified(response.data);
            } else {
                setError('School not found with this UDISE code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch school details');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSchool) {
            setError('Please select a school');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const school = schools.find(s => s.udiseCode === selectedSchool);
            if (school) {
                onSchoolIdentified(school);
            }
        } catch (err) {
            setError('Failed to load school details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Identify Your School
                </h2>
                <p className="text-gray-600">
                    Choose a method to identify your school and proceed with data entry
                </p>
            </div>

            {/* Method Selection */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => handleMethodChange('udise')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${method === 'udise'
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    UDISE Code
                </button>
                <button
                    onClick={() => handleMethodChange('manual')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${method === 'manual'
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Manual Selection
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* UDISE Method */}
            {method === 'udise' && (
                <form onSubmit={handleUdiseSubmit} className="space-y-6">
                    <div>
                        <label className="form-label">UDISE Code</label>
                        <input
                            type="text"
                            value={udiseCode}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d+$/.test(val)) {
                                    setUdiseCode(val);
                                }
                            }}
                            placeholder="Enter 11-digit UDISE code"
                            className="form-input"
                            required
                            maxLength={11}
                            pattern="\d{11}"
                            title="Please enter a valid 11-digit UDISE code"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter your school's unique 11-digit UDISE identification code
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || udiseCode.length !== 11}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Searching...
                            </span>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>
            )}

            {/* Manual Selection Method */}
            {method === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-6">
                    <div>
                        <label className="form-label">District</label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className="form-select"
                            required
                        >
                            <option value="">Select District</option>
                            {districts.map((district) => (
                                <option key={district} value={district}>
                                    {district}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedDistrict && (
                        <div>
                            <label className="form-label">Taluka</label>
                            <select
                                value={selectedTaluka}
                                onChange={(e) => handleTalukaChange(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="">Select Taluka</option>
                                {talukas.map((taluka) => (
                                    <option key={taluka} value={taluka}>
                                        {taluka}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedTaluka && (
                        <div className="relative">
                            <label className="form-label">School</label>
                            <input
                                type="text"
                                value={schoolSearchTerm}
                                onChange={(e) => {
                                    setSchoolSearchTerm(e.target.value);
                                    setSelectedSchool('');
                                    setIsSchoolDropdownOpen(true);
                                }}
                                onFocus={() => setIsSchoolDropdownOpen(true)}
                                placeholder="Search for school..."
                                className="form-input"
                            />

                            {/* Backdrop to close dropdown when clicking outside */}
                            {isSchoolDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-0"
                                    onClick={() => setIsSchoolDropdownOpen(false)}
                                ></div>
                            )}

                            {isSchoolDropdownOpen && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                                    {schools.filter(school =>
                                        school.schoolName.toLowerCase().includes(schoolSearchTerm.toLowerCase())
                                    ).slice(0, 50).length > 0 ? (
                                        schools.filter(school =>
                                            school.schoolName.toLowerCase().includes(schoolSearchTerm.toLowerCase())
                                        ).slice(0, 50).map((school) => (
                                            <li
                                                key={school.udiseCode}
                                                onClick={() => {
                                                    setSelectedSchool(school.udiseCode);
                                                    setSchoolSearchTerm(school.schoolName);
                                                    setIsSchoolDropdownOpen(false);
                                                }}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 transition-colors"
                                            >
                                                {school.schoolName}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500 italic">No schools found</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !selectedSchool}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                            </span>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>

            )}

        </div>

    );

}

export default SchoolIdentification;
