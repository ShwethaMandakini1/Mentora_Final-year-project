const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect } = require('../middleware/auth');

const {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

// ── Multer setup (assignment instruction/template PDFs) ───────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext     = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF/DOC/DOCX allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).fields([
  { name: 'instructionFile', maxCount: 1 },
  { name: 'templateFile',    maxCount: 1 },
]);

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/',     protect, upload, createAssignment);
router.get('/',      protect, getAssignments);
router.get('/:id',   protect, getAssignment);
router.put('/:id',   protect, upload, updateAssignment);
router.delete('/:id',protect, deleteAssignment);

module.exports = router;