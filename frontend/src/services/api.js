import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  return 'https://task-manager-uc41.onrender.com';
};

export const getFullUrl = (path) => {
  const base = getApiBaseUrl();
  return path.startsWith('http') ? path : `${base}${path}`;
};

const api = axios.create({
  baseURL: 'https://task-manager-uc41.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        const isHtml = error.response.data.trim().startsWith('<!');
        error.response.data = {
          error: isHtml ? 'Internal server error (HTML response)' : error.response.data
        };
      } else {
        error.response.data.error = error.response.data.error || 'Something went wrong';
      }
    } else if (error.response) {
      error.response.data = { error: 'Something went wrong' };
    }
    return Promise.reject(error);
  }
);

export default api;
