import axios from 'axios';

const adminAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── ADMIN AUTH ─────────────────────────────
export const adminLogin = (data) =>
  adminAPI.post('/admin/login', data);

// ── ADMIN FEATURES ─────────────────────────
export const getAdminDashboard = () =>
  adminAPI.get('/admin/dashboard');

export const getAllUsers = () =>
  adminAPI.get('/admin/users');

export const getAllSubscriptions = () =>
  adminAPI.get('/admin/subscriptions');

export default adminAPI;