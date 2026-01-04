import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Store navigation handler reference
let navigationHandler = null;

export const setNavigationHandler = (handler) => {
  navigationHandler = handler;
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (typeof window !== 'undefined' && error.response) {
      const { status, data } = error.response;

      // Unauthorized - redirect to login
      if (status === 401) {
        localStorage.removeItem('token');
        if (navigationHandler && window.location.pathname !== '/login') {
          navigationHandler('/login');
        }
      }

      // Forbidden - handle password change requirement
      if (status === 403 && data.requirePasswordChange) {
        if (navigationHandler && window.location.pathname !== '/change-password') {
          navigationHandler('/change-password');
        }
      }

      // Rate limited
      if (status === 429) {
        console.error('Rate limited. Please wait before trying again.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
