/**
 * adminRoutes.js - Admin API Routes
 * 
 * ENDPOINTS:
 * 
 * PUBLIC:
 * POST   /admin/login                     - Admin login (returns JWT token)
 * 
 * PROTECTED (require admin auth):
 * 
 * STATS:
 * GET    /admin/stats                     - Dashboard statistics (cached 10 min)
 * POST   /admin/stats/refresh             - Clear stats cache
 * 
 * USERS:
 * GET    /admin/users                     - List all users (with search/filter)
 * PUT    /admin/users/:userId/subscription - Update user subscription plan
 * DELETE /admin/users/:userId              - Delete a user
 * 
 * LECTURERS:
 * GET    /admin/lecturers                 - List all lecturers (with search)
 * DELETE /admin/lecturers/:lecturerId     - Delete a lecturer
 * 
 * SUBSCRIPTIONS:
 * GET    /admin/subscriptions             - List users by subscription plan
 * 
 * ADMIN MANAGEMENT:
 * GET    /admin/admins                    - List all admins
 * POST   /admin/admins                    - Create a new admin
 * DELETE /admin/admins/:adminId           - Delete an admin
 * 
 * BROADCAST:
 * POST   /admin/broadcast                 - Send notification to user group
 */

const express    = require('express');
const router     = express.Router();
const adminAuth  = require('../middleware/adminAuth');
const ctrl       = require('../controllers/adminController');

// ── PUBLIC ROUTES ────────────────────────────────────────────────────────────
router.post('/login', ctrl.login);

// ── PROTECTED ROUTES (all below require admin token) ─────────────────────────
router.use(adminAuth);

// ── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats',          ctrl.getStats);        // Get dashboard stats (cached)
router.post('/stats/refresh', ctrl.refreshStats);    // Clear cache and fetch fresh

// ── USERS (students + general user management) ───────────────────────────────
router.get('/users',                          ctrl.getUsers);                 // List all users
router.put('/users/:userId/subscription',     ctrl.updateUserSubscription);   // Update subscription plan
router.delete('/users/:userId',               ctrl.deleteUser);               // Delete a user

// ── LECTURERS ────────────────────────────────────────────────────────────────
router.get('/lecturers',                      ctrl.getLecturers);             // List all lecturers
router.delete('/lecturers/:lecturerId',       ctrl.deleteLecturer);           // Delete a lecturer

// ── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
router.get('/subscriptions',                  ctrl.getSubscriptions);         // List by plan (free/pro/institution)

// ── ADMIN MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/admins',                         ctrl.getAdmins);                // List all admins
router.post('/admins',                        ctrl.createAdmin);              // Create new admin
router.delete('/admins/:adminId',             ctrl.deleteAdmin);              // Delete an admin

// ── BROADCAST ────────────────────────────────────────────────────────────────
// Send a notification to all users, students only, or lecturers only
// Body: { recipient: 'all'|'students'|'lecturers', title: string, message: string }
router.post('/broadcast',                     ctrl.sendBroadcast);

module.exports = router;