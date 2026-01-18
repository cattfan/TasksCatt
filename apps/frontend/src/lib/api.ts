import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Custom event for toast notifications
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-toast', {
            detail: { message, type }
        }));
    }
};

// Create axios instance
export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,  // Updated to use versioned API
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors with user feedback
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; code?: string }>) => {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;

        // Handle specific error codes
        switch (status) {
            case 401:
                // Token expired or invalid
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    if (!window.location.pathname.includes('/login')) {
                        showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                        window.location.href = '/login';
                    }
                }
                break;

            case 403:
                showToast('Bạn không có quyền thực hiện hành động này.', 'error');
                break;

            case 404:
                showToast('Không tìm thấy tài nguyên yêu cầu.', 'error');
                break;

            case 429:
                showToast('Quá nhiều yêu cầu. Vui lòng thử lại sau.', 'error');
                break;

            case 500:
            case 502:
            case 503:
                showToast('Lỗi máy chủ. Vui lòng thử lại sau.', 'error');
                break;

            default:
                if (errorMessage && !error.message.includes('canceled')) {
                    showToast(errorMessage, 'error');
                }
        }

        return Promise.reject(error);
    }
);

export default api;

