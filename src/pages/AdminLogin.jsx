import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log('=== LOGIN STARTED ===');
        console.log('Username:', username);
        console.log('Password length:', password.length);

        setError('');
        setLoading(true);

        try {
            console.log('Calling API...');
            const response = await adminAPI.login({ username, password });
            console.log('✅ Login successful!', response.data);

            login(response.data.admin, response.data.token);
            console.log('✅ Auth context updated');

            // Navigate after a brief delay
            setTimeout(() => {
                console.log('✅ Navigating to dashboard...');
                navigate('/admin/dashboard');
            }, 100);
        } catch (err) {
            console.error('❌ Login error:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.message || 'Invalid credentials');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-blue-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <span className="text-4xl">📊</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">ReportRight</h1>
                    <p className="text-white/80">Admin Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Welcome Back
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="form-input"
                                placeholder="Enter your username"
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                            />
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="Enter your password"
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
                            ← Back to Home
                        </a>
                    </div>
                </div>

                <p className="text-center text-white/60 text-sm mt-6">
                    © 2026 ReportRight. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default AdminLogin;
