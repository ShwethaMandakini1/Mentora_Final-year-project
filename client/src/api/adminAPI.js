/**
 * adminAPI.js - Admin API Client
 *
 * Axios instance with automatic Bearer token injection for admin routes
 * 
 * IMPORTANT: baseURL is VITE_API_URL (e.g. http://localhost:5000/api)
 * All endpoint paths include /admin/ prefix because the server mounts
 * admin routes at /api/admin (see app.js: app.use('/api/admin', ...))
 */

import axios from 'axios';

// Base URL = VITE_API_URL (e.g. http://localhost:5000/api)
// Do NOT append '/admin' here — endpoints already include it
const adminAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Automatically attach JWT token from localStorage to every request
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const adminLogin = (data) =>
  adminAPI.post('/admin/login', data);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminStats = () =>
  adminAPI.get('/admin/stats');

export const refreshStats = () =>
  adminAPI.post('/admin/stats/refresh');

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = (params) =>
  adminAPI.get('/admin/users', { params });

export const updateUserSubscription = (userId, plan) =>
  adminAPI.put(`/admin/users/${userId}/subscription`, { plan });

export const deleteUser = (userId) =>
  adminAPI.delete(`/admin/users/${userId}`);

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getAllLecturers = (params) =>
  adminAPI.get('/admin/lecturers', { params });

export const deleteLecturer = (lecturerId) =>
  adminAPI.delete(`/admin/lecturers/${lecturerId}`);

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSubscriptions = (params) =>
  adminAPI.get('/admin/subscriptions', { params });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getAllAdmins = () =>
  adminAPI.get('/admin/admins');

export const createAdmin = (data) =>
  adminAPI.post('/admin/admins', data);

export const deleteAdmin = (adminId) =>
  adminAPI.delete(`/admin/admins/${adminId}`);

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST MESSAGING
// Send notification to a user group
// Body: { recipient: 'all'|'students'|'lecturers', title: string, message: string }
// ─────────────────────────────────────────────────────────────────────────────
export const sendBroadcast = (data) =>
  adminAPI.post('/admin/broadcast', data);

export default adminAPI;