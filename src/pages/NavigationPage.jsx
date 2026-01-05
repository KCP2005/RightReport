import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HierarchicalNav from '../components/Admin/HierarchicalNav';

function NavigationPage() {
    const { admin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!admin) {
            navigate('/admin/login');
        }
    }, [admin, navigate]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">School Navigation</h1>
                    <p className="text-sm text-gray-600">Browse schools by district and taluka</p>
                </div>
            </div>

            <HierarchicalNav />
        </div>
    );
}

export default NavigationPage;
