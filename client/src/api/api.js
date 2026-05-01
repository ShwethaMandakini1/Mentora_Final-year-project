import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── AUTH ──────────────────────────────────────────
export const registerUser   = (data) => API.post('/auth/register', data);
export const loginUser      = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const verifyOTP      = (data) => API.post('/auth/verify-otp', data);
export const resetPassword  = (data) => API.post('/auth/reset-password', data);
export const getMe          = ()     => API.get('/auth/me');

// ── USER ──────────────────────────────────────────
export const getProfile     = ()     => API.get('/user/profile');
export const updateProfile  = (data) => API.put('/user/profile', data);
export const updatePassword = (data) => API.put('/user/update-password', data);
export const getAllStudents  = ()     => API.get('/user/students');

// ── SUBMISSIONS ───────────────────────────────────
export const submitAssignment  = (data)      => API.post('/submissions', data);
export const getMySubmissions  = ()          => API.get('/submissions/my');
export const getAllSubmissions  = ()          => API.get('/submissions/all');
export const getSubmission     = (id)        => API.get(`/submissions/${id}`);
export const gradeSubmission   = (id, data)  => API.put(`/submissions/${id}/grade`, data);
export const updateSubmission  = (id, data)  => API.put(`/submissions/${id}`, data);
export const deleteSubmission  = (id)        => API.delete(`/submissions/${id}`);
export const getDashboardStats = () => API.get('/submissions/stats');

// ── ASSIGNMENTS ───────────────────────────────────
export const getAssignments   = ()         => API.get('/assignments');
export const getAssignment    = (id)       => API.get(`/assignments/${id}`);
export const createAssignment = (data)     => API.post('/assignments', data);
export const updateAssignment = (id, data) => API.put(`/assignments/${id}`, data);
export const deleteAssignment = (id)       => API.delete(`/assignments/${id}`);

// ── Notifications ──────────────────────────────────────

export const getNotifications       = () => API.get('/notifications');
export const markNotificationRead   = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');
export const deleteNotification     = (id) => API.delete(`/notifications/${id}`);
export const deleteAllNotifications = () => API.delete('/notifications/all');

export default API;