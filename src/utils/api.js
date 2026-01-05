import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export const reportAPI = {
    analyzeForm: (formId) => api.post('/admin/reports/analyze-form', { formId }),
    generateReport: (data) => api.post('/admin/reports/generate', data),
    compareReport: (data) => api.post('/admin/reports/compare', data)
};

export default api;

// School APIs
export const schoolAPI = {
    getAllSchools: () => api.get('/schools/by-location'),
    searchByUDISE: (udiseCode) => api.get(`/schools/by-udise/${udiseCode}`),
    searchByLocation: (district, taluka) =>
        api.get('/schools/by-location', { params: { district, taluka } }),
    getSchoolsByLocation: (district, taluka) =>
        api.get('/schools/by-location', { params: { district, taluka } }),
    search: (query) => api.get('/schools/search', { params: { q: query } }),
    getDistricts: () => api.get('/districts'),
    getTalukas: (districtName) => api.get(`/talukas/${districtName}`),
    importSchools: (formData) =>
        api.post('/admin/schools/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    createSchool: (schoolData) => api.post('/admin/schools/create', schoolData),
    updateSchool: (udiseCode, data) => api.put(`/schools/update/${udiseCode}`, data),
};

// Form APIs
export const formAPI = {
    getActiveForms: () => api.get('/forms/active'),
    getFormById: (formId) => api.get(`/forms/${formId}`),
    createForm: (formData) => api.post('/admin/forms/create', formData),
    updateForm: (formId, formData) => api.put(`/admin/forms/${formId}`, formData),
    deleteForm: (formId) => api.delete(`/admin/forms/${formId}`),
    listForms: () => api.get('/admin/forms/list'),
};

// Response APIs
export const responseAPI = {
    submitResponse: (responseData) => api.post('/responses/submit', responseData),
    getBySchool: (udiseCode) => api.get(`/responses/by-school/${udiseCode}`),
    checkSubmission: (udiseCode, formId) => api.get(`/responses/check/${udiseCode}/${formId}`),
    updateResponse: (responseId, responseData) => api.put(`/responses/${responseId}/update`, responseData),
    listResponses: (filters) => api.get('/admin/responses/list', { params: filters }),
    getResponseById: (responseId) => api.get(`/admin/responses/${responseId}`),
};

// Edit Request APIs
export const editRequestAPI = {
    createRequest: (requestData) => api.post('/edit-requests/create', requestData),
    getBySchool: (udiseCode) => api.get(`/edit-requests/by-school/${udiseCode}`),
    getPendingRequests: () => api.get('/admin/edit-requests/pending'),
    getAllRequests: (page = 1, limit = 10, status = '') =>
        api.get('/admin/edit-requests/all', { params: { page, limit, status } }),
    approveRequest: (requestId, data) =>
        api.put(`/admin/edit-requests/${requestId}/approve`, data),
    rejectRequest: (requestId, data) =>
        api.put(`/admin/edit-requests/${requestId}/reject`, data),
};

// Admin APIs
export const adminAPI = {
    login: (credentials) => api.post('/admin/login', credentials),
    logout: () => api.post('/admin/logout'),
    createForm: (formData) => api.post('/admin/forms/create', formData),
    updateForm: (formId, formData) => api.put(`/admin/forms/${formId}`, formData),
    deleteForm: (formId) => api.delete(`/admin/forms/${formId}`),
    listForms: () => api.get('/admin/forms/list'),
    getDashboardStats: () => api.get('/admin/dashboard/stats'),
    getDistrictAnalytics: () => api.get('/admin/analytics/district-wise'),
    getTalukaAnalytics: () => api.get('/admin/analytics/taluka-wise'),
    generateReport: (reportConfig) => api.post('/admin/reports/generate', reportConfig),
    exportReport: (reportId, format) =>
        api.get('/admin/reports/export', {
            params: { reportId, format },
            responseType: 'blob',
        }),
};

export const fileAPI = {
    uploadFile: (formData) =>
        api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteFile: (fileId, resourceType) => api.delete(`/files/delete/${fileId}`, { params: { resourceType } }),
};
