const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect, authorize } = require('../middleware/auth');

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
} = require('../controllers/submissionController');

// ── Multer setup ──────────────────────────────────────────────────────────────
const submissionsDir = path.join(__dirname, '..', 'submissions');
if (!fs.existsSync(submissionsDir)) fs.mkdirSync(submissionsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, submissionsDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
// ── Existing fixed routes (no :id) ───────────────────────────────────────────
router.post('/',              protect, upload.single('file'), submit);
router.get('/my',             protect, getMySubmissions);
router.get('/all',            protect, getAllSubmissions);
router.get('/stats',          protect, getDashboardStats);

// ── Pre-Approval Routes (must be before /:id) ─────────────────────────────────
router.post('/submit-for-approval', protect, upload.single('file'), submitForApproval);
router.get('/pending-approvals',    protect, getPendingApprovals);

// ── Routes with :id (must be last) ───────────────────────────────────────────
router.get('/:id',            protect, getSubmission);
router.put('/:id/grade',      protect, gradeSubmission);
router.post('/:id/reanalyse', protect, reanalyseSubmission);
router.put('/:id',            protect, upload.single('file'), updateSubmission);
router.delete('/:id',         protect, deleteSubmission);
router.patch('/:id/approve',  protect, approveSubmission);
router.patch('/:id/reject',   protect, rejectSubmission);

module.exports = router;