import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminLayout() {
    const { admin, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/navigation', icon: '🗺️', label: 'Navigation' },
        { path: '/admin/reports', icon: '📈', label: 'Reports' },
        { path: '/admin/forms/builder', icon: '📝', label: 'Form Builder' },
        { path: '/admin/edit-requests', icon: '✏️', label: 'Edit Requests' },
        { path: '/admin/schools/import', icon: '📥', label: 'Import Schools' },
    ];

    const quickActions = [
        { path: '/admin/forms/builder', icon: '➕', label: 'Create New Form' },
        { path: '/admin/schools/import', icon: '🏫', label: 'Add School' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20">
                {/* Logo */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        R
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">ReportRight</h1>
                        <p className="text-xs text-gray-500">Admin Panel</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-8">
                    {/* Main Menu */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</p>
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Quick Actions</p>
                        <ul className="space-y-1">
                            {quickActions.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
                                    >
                                        <div className="w-6 h-6 bg-purple-100 rounded text-purple-600 flex items-center justify-center text-xs group-hover:bg-purple-200 transition-colors">
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                            👤
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{admin?.username}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <span>🚪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        R
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">ReportRight</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed top-0 left-0 w-64 h-full bg-white z-40 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Same sidebar content but for mobile */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500">✕</button>
                </div>
                <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
                    {/* Main Menu */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</p>
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Quick Actions */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Quick Actions</p>
                        <ul className="space-y-1">
                            {quickActions.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
                                    >
                                        <div className="w-6 h-6 bg-purple-100 rounded text-purple-600 flex items-center justify-center text-xs group-hover:bg-purple-200 transition-colors">
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            <span>🚪</span>
                            Logout
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 transition-all md:mt-0 mt-14">
                <main className="flex-1 p-4 md:p-8 min-w-0 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>

            <footer className="bg-white border-t border-gray-200 py-8 mt-auto z-10 relative">
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

export default AdminLayout;
