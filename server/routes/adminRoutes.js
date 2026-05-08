const express    = require('express');
const router     = express.Router();
const adminAuth  = require('../middleware/adminAuth');
const ctrl       = require('../controllers/adminController');

// Public
router.post('/login', ctrl.login);

// Protected — all below require admin token
router.use(adminAuth);

// Stats
router.get('/stats',          ctrl.getStats);
router.post('/stats/refresh', ctrl.refreshStats);

// Users (students)
router.get('/users',                          ctrl.getUsers);
router.put('/users/:userId/subscription',     ctrl.updateUserSubscription);
router.delete('/users/:userId',               ctrl.deleteUser);

// Lecturers
router.get('/lecturers',                      ctrl.getLecturers);
router.delete('/lecturers/:lecturerId',       ctrl.deleteLecturer);

// Subscriptions
router.get('/subscriptions',                  ctrl.getSubscriptions);

// Admin management
router.get('/admins',                         ctrl.getAdmins);
router.post('/admins',                        ctrl.createAdmin);
router.delete('/admins/:adminId',             ctrl.deleteAdmin);

module.exports = router;