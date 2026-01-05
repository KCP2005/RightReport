import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportBuilder from '../components/Admin/ReportBuilder';

function ReportsPage() {
    const { admin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!admin) {
            navigate('/admin/login');
        }
    }, [admin, navigate]);

    return (
        <>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-sm text-gray-600">Generate and export data reports</p>
                </div>
            </div>

            <ReportBuilder />
        </>
    );
}

export default ReportsPage;
