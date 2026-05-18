import axios from 'axios';

const getApiBaseUrl = () => {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envBaseUrl && envBaseUrl.trim().length > 0) return envBaseUrl;

  // For browser: try to connect to backend on same host
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // For local development (localhost or 127.0.0.1), try port 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }
    // For LAN development, assume backend is on :5000
    if (hostname.startsWith('192.') || hostname.startsWith('10.')) {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }
    // For production (Vercel, etc.), use the multi-service route prefix
    return '/_/backend';
  }

  // For SSR/server-side, use the multi-service route prefix (Vercel)
  return '/_/backend';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('mt_token');
      localStorage.removeItem('mt_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
