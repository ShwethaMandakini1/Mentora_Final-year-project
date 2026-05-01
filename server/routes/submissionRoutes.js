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
  reanalyseSubmission,   // ← NEW
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

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/',              protect, upload.single('file'), submit);
router.get('/my',             protect, getMySubmissions);
router.get('/all',            protect, getAllSubmissions);
router.get('/stats',          protect, getDashboardStats);
router.get('/:id',            protect, getSubmission);
router.put('/:id/grade',      protect, gradeSubmission);
router.post('/:id/reanalyse', protect, reanalyseSubmission);   // ← NEW
router.put('/:id',            protect, upload.single('file'), updateSubmission);
router.delete('/:id',         protect, deleteSubmission);

module.exports = router;