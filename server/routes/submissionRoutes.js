const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const {
  submit,
  getMySubmissions,
  getAllSubmissions,
  getSubmission,
  gradeSubmission,
  getDashboardStats,
  updateSubmission,
  deleteSubmission,
  reanalyseSubmission,
  submitForApproval,
  getPendingApprovals,
  approveSubmission,
  rejectSubmission,
  previewSubmission,
  requestRegrade,
  acceptRegrade,
} = require('../controllers/submissionController');

// ── Multer setup ─────────────────────────────
const submissionsDir = path.join(__dirname, '..', 'submissions');

if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, submissionsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ── Main submission routes ───────────────────
router.post('/', protect, upload.single('file'), submit);
router.get('/my', protect, getMySubmissions);
router.get('/all', protect, getAllSubmissions);
router.get('/stats', protect, getDashboardStats);

// ── Pre-approval routes ──────────────────────
router.post('/submit-for-approval', protect, upload.single('file'), submitForApproval);
router.get('/pending-approvals', protect, getPendingApprovals);

// ── Preview route MUST be before /:id ────────
router.get('/:id/preview', protect, previewSubmission);

// ── ID routes ────────────────────────────────
router.get('/:id', protect, getSubmission);
router.put('/:id/grade', protect, gradeSubmission);
router.post('/:id/reanalyse', protect, reanalyseSubmission);
router.put('/:id', protect, upload.single('file'), updateSubmission);
router.delete('/:id', protect, deleteSubmission);
router.patch('/:id/approve', protect, approveSubmission);
router.patch('/:id/reject', protect, rejectSubmission);

// ✅ Re-grade routes
// Main route used by frontend api.js:
router.post('/:id/request-regrade', protect, requestRegrade);

// Backup alias, so old frontend calls will also work:
router.post('/:id/regrade-request', protect, requestRegrade);

router.put('/:id/accept-regrade', protect, acceptRegrade);

module.exports = router;
