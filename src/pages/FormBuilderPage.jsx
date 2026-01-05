import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';
import FormBuilder from '../components/Admin/FormBuilder';

function FormBuilderPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingForm, setEditingForm] = useState(null);

    const { admin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!admin) {
            navigate('/admin/login');
            return;
        }
        fetchForms();
    }, [admin, navigate]);

    const fetchForms = async () => {
        try {
            const response = await adminAPI.listForms();
            setForms(response.data || []);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveForm = async (formData) => {
        try {
            if (editingForm) {
                await adminAPI.updateForm(editingForm.formId, formData);
            } else {
                await adminAPI.createForm(formData);
            }
            setShowBuilder(false);
            setEditingForm(null);
            fetchForms();
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Failed to save form. Please try again.');
        }
    };

    const handleEditForm = (form) => {
        setEditingForm(form);
        setShowBuilder(true);
    };

    const handleDeleteForm = async (formId) => {
        if (!confirm('Are you sure you want to delete this form?')) return;

        try {
            await adminAPI.deleteForm(formId);
            fetchForms();
        } catch (error) {
            console.error('Error deleting form:', error);
            alert('Failed to delete form');
        }
    };

    const toggleFormStatus = async (formId, currentStatus) => {
        try {
            await adminAPI.updateForm(formId, { isActive: !currentStatus });
            fetchForms();
        } catch (error) {
            console.error('Error updating form status:', error);
        }
    };

    if (showBuilder) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {editingForm ? 'Edit Form' : 'Create New Form'}
                        </h1>
                    </div>
                    <FormBuilder
                        initialForm={editingForm}
                        onSave={handleSaveForm}
                        onCancel={() => {
                            setShowBuilder(false);
                            setEditingForm(null);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
                    <p className="text-sm text-gray-600">Create and manage data collection forms</p>
                </div>
                <button onClick={() => setShowBuilder(true)} className="btn btn-primary btn-sm">
                    + Create New Form
                </button>
            </div>
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No forms yet</h3>
                    <p className="text-gray-600 mb-6">Create your first data collection form</p>
                    <button onClick={() => setShowBuilder(true)} className="btn btn-primary">
                        Create New Form
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map((form) => (
                        <div key={form.formId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">{form.formTitle}</h3>
                                    {form.formDescription && (
                                        <p className="text-sm text-gray-600 line-clamp-2">{form.formDescription}</p>
                                    )}
                                </div>
                                <span
                                    className={`badge ${form.isActive ? 'badge-success' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {form.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="text-sm text-gray-500 mb-4">
                                <p>{form.fields?.length || 0} fields</p>
                                <p className="text-xs">Created {new Date(form.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleEditForm(form)} className="btn btn-secondary btn-sm flex-1">
                                    Edit
                                </button>
                                <button
                                    onClick={() => toggleFormStatus(form.formId, form.isActive)}
                                    className="btn btn-outline btn-sm"
                                >
                                    {form.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleDeleteForm(form.formId)}
                                    className="btn btn-outline btn-sm text-red-500 border-red-500"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FormBuilderPage;
