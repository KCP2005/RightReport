import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');

        if (token && adminData) {
            setAdmin(JSON.parse(adminData));
        }
        setLoading(false);
    }, []);

    const login = (adminData, token) => {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        setAdmin(adminData);
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setAdmin(null);
    };

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ admin, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
