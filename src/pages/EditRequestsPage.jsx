import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EditRequestsManager from '../components/Admin/EditRequestsManager';

function EditRequestsPage() {
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
                    <h1 className="text-2xl font-bold text-gray-900">Edit Requests</h1>
                    <p className="text-sm text-gray-600">Review and manage data edit requests</p>
                </div>
            </div>

            <EditRequestsManager />
        </div>
    );
}

export default EditRequestsPage;
