import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const getBaseURL = () => {
    let envUrl = import.meta.env.VITE_API_URL;

    // Clean up quotes or whitespace that might be injected by the environment
    if (envUrl) {
        envUrl = String(envUrl).replace(/['"]/g, '').trim();
    }

    if (!envUrl ||
        envUrl === 'undefined' ||
        envUrl === 'null' ||
        envUrl === '') {
        return 'http://localhost:8000/api';
    }

    // Force absolute URL to prevent relative path disasters in window.open
    if (!envUrl.startsWith('http')) {
        return `http://localhost:8000/api`;
    }

    return envUrl;
};

export const API_BASE_URL = getBaseURL();
window.__P2P_API_URL = API_BASE_URL; // Global fallback
console.log('P2P App: API_BASE_URL is verified as:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';

        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            toast.error('Unauthorized access');
        } else if (error.response?.status === 422) {
            // Show the error message if provided by the backend
            if (message) toast.error(message);
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
