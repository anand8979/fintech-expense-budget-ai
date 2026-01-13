import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Transaction APIs
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getSummary: (params) => api.get('/transactions/summary', { params }),
};

// Category APIs
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Budget APIs
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getOne: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getTracking: () => api.get('/budgets/tracking'),
};

// Dashboard APIs
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getSpendingByCategory: (params) => api.get('/analytics/spending-by-category', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getDailyTrend: (params) => api.get('/analytics/daily-trend', { params }),
  getComparison: (params) => api.get('/analytics/comparison', { params }),
};

// Export APIs
export const exportAPI = {
  exportPDF: (params) => api.get('/export/pdf', { params, responseType: 'blob' }),
  exportCSV: (params) => api.get('/export/csv', { params, responseType: 'blob' }),
};

// AI APIs
export const aiAPI = {
  categorize: (data) => api.post('/ai/categorize', data),
  getInsights: (params) => api.get('/ai/insights', { params }),
  getBudgetSuggestions: () => api.get('/ai/budget-suggestions'),
  predictSpending: (params) => api.get('/ai/predict-spending', { params }),
  chat: (data) => api.post('/ai/chat', data),
};

// Admin APIs
export const adminAPI = {
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserStats: (userId) => api.get(`/admin/users/${userId}/stats`),
  getUserAnalytics: (userId, params) => api.get(`/admin/users/${userId}/analytics`, { params }),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  // Global data
  getAllTransactions: (params) => api.get('/admin/transactions', { params }),
  getAllBudgets: (params) => api.get('/admin/budgets', { params }),
  getGlobalAnalytics: (params) => api.get('/admin/analytics', { params }),
};

export default api;
