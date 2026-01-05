import { useState, useEffect } from 'react';
import SchoolIdentification from '../components/User/SchoolIdentification';
import DynamicForm from '../components/User/DynamicForm';
import ViewSubmissions from '../components/User/ViewSubmissions';
import { responseAPI, formAPI } from '../utils/api';

function UserHome() {
    const [currentStep, setCurrentStep] = useState(() => {
        // Load from localStorage on initial render
        return localStorage.getItem('userHomeStep') || 'identify';
    });
    const [selectedSchool, setSelectedSchool] = useState(() => {
        // Load from localStorage on initial render
        const saved = localStorage.getItem('selectedSchool');
        return saved ? JSON.parse(saved) : null;
    });
    const [selectedForm, setSelectedForm] = useState(null);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (selectedSchool) {
            localStorage.setItem('selectedSchool', JSON.stringify(selectedSchool));
            localStorage.setItem('userHomeStep', currentStep);
        } else {
            localStorage.removeItem('selectedSchool');
            localStorage.removeItem('userHomeStep');
        }
    }, [selectedSchool, currentStep]);

    // Scroll to top when step changes (Scroll Wrapper)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const handleSchoolIdentified = async (schoolData) => {
        setSelectedSchool(schoolData);

        try {
            // 1. Get Active Forms
            const formsRes = await formAPI.getActiveForms();
            const activeForms = formsRes.data || [];

            if (activeForms.length === 0) {
                // No active forms - stay on form page (DynamicForm will show empty state or message)
                setCurrentStep('form');
                return;
            }

            const activeFormId = activeForms[0].formId;

            // 2. Check if school has submitted specifically for the ACTIVE form
            const checkRes = await responseAPI.checkSubmission(schoolData.udiseCode, activeFormId);

            if (checkRes.data && checkRes.data.exists) {
                // Has submitted ACTIVE form -> View
                setCurrentStep('view');
            } else {
                // Has NOT submitted active form -> Fill Form
                // (Even if they have old submissions for inactive forms)
                setCurrentStep('form');
            }
        } catch (err) {
            console.error('Error checking status:', err);
            // Fallback
            setCurrentStep('form');
        }
    };

    const handleFormSubmitted = () => {
        setCurrentStep('view');
    };

    const handleReset = () => {
        setCurrentStep('identify');
        setSelectedSchool(null);
        setSelectedForm(null);
        // Clear localStorage
        localStorage.removeItem('selectedSchool');
        localStorage.removeItem('userHomeStep');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-3xl lg:text-4xl shadow-lg">
                                📊
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                                    ReportRight
                                </h1>
                                <p className="text-sm text-gray-600">School Data Collection Portal</p>
                            </div>
                        </div>
                        {selectedSchool && (
                            <button onClick={handleReset} className="btn btn-outline btn-sm">
                                Start New Entry
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 py-8 lg:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Progress Steps */}
                    {selectedSchool && (
                        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg mb-8 lg:mb-12">
                            <div className="flex items-center justify-center">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep === 'identify'
                                        ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg scale-110'
                                        : 'bg-green-500 text-white'
                                        }`}>
                                        {currentStep === 'identify' ? '1' : '✓'}
                                    </div>
                                    <span className={`mt-2 text-xs lg:text-sm font-medium ${currentStep === 'identify' ? 'text-primary-600' : 'text-gray-600'
                                        }`}>
                                        Identify School
                                    </span>
                                </div>

                                {/* Line */}
                                <div className="w-16 lg:w-24 h-0.5 bg-gray-300 mx-2 lg:mx-4"></div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep === 'form'
                                        ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg scale-110'
                                        : currentStep === 'view'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {currentStep === 'view' ? '✓' : '2'}
                                    </div>
                                    <span className={`mt-2 text-xs lg:text-sm font-medium ${currentStep === 'form' ? 'text-primary-600' : 'text-gray-600'
                                        }`}>
                                        Fill Form
                                    </span>
                                </div>

                                {/* Line */}
                                <div className="w-16 lg:w-24 h-0.5 bg-gray-300 mx-2 lg:mx-4"></div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep === 'view'
                                        ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg scale-110'
                                        : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        3
                                    </div>
                                    <span className={`mt-2 text-xs lg:text-sm font-medium ${currentStep === 'view' ? 'text-primary-600' : 'text-gray-600'
                                        }`}>
                                        View Submissions
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="bg-white rounded-2xl p-6 lg:p-12 shadow-xl min-h-[400px] animate-fade-in">
                        {currentStep === 'identify' && (
                            <SchoolIdentification onSchoolIdentified={handleSchoolIdentified} />
                        )}

                        {currentStep === 'form' && selectedSchool && (
                            <DynamicForm
                                school={selectedSchool}
                                onFormSubmitted={handleFormSubmitted}
                                onBack={() => setCurrentStep('identify')}
                            />
                        )}

                        {currentStep === 'view' && selectedSchool && (
                            <ViewSubmissions
                                school={selectedSchool}
                                onBack={() => setCurrentStep('form')}
                            />
                        )}
                    </div>
                </div>
            </main>
            {/* Contact Admin Box */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h4>
                <p className="text-blue-700 mb-4">
                    If you are facing any issues or need assistance, please contact the administrator.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-blue-800">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{import.meta.env.VITE_ADMIN_CONTACT_EMAIL}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium">{import.meta.env.VITE_ADMIN_CONTACT_PHONE}</span>
                    </div>
                </div>
            </div>



            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">

                    <div className="mx-auto mb-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>

                    <p className="text-sm text-gray-700">
                        © 2026 <span className="font-semibold">ReportRight</span> – School Data Collection Portal
                    </p>

                    <p className="text-sm font-medium text-gray-600 mt-1">
                        A Product of <span className="font-semibold text-gray-700">Kartik Creative Production</span>.
                    </p>

                </div>
            </footer>

        </div>
    );
}

export default UserHome;
