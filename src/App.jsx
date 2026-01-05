import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Suspense, lazy } from 'react';

// Lazy loaded pages
const UserHome = lazy(() => import('./pages/UserHome'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SchoolDetailPage = lazy(() => import('./pages/SchoolDetailPage'));
const FormBuilderPage = lazy(() => import('./pages/FormBuilderPage'));
const SchoolImportPage = lazy(() => import('./pages/SchoolImportPage'));
const EditRequestsPage = lazy(() => import('./pages/EditRequestsPage'));
const NavigationPage = lazy(() => import('./pages/NavigationPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AdminLayout = lazy(() => import('./components/Admin/AdminLayout'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<UserHome />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="school/:udiseCode" element={<SchoolDetailPage />} />
              <Route path="forms/builder" element={<FormBuilderPage />} />
              <Route path="schools/import" element={<SchoolImportPage />} />
              <Route path="edit-requests" element={<EditRequestsPage />} />
              <Route path="navigation" element={<NavigationPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );

}

export default App;
