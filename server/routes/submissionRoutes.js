const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
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
  markAndDecide,
  previewSubmission,
  requestRegrade,
  acceptRegrade,
} = require('../controllers/submissionController');

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

router.post('/',                    protect, upload.single('file'), submit);
router.post('/submit-for-approval', protect, upload.single('file'), submitForApproval);

router.get('/my',                   protect, getMySubmissions);
router.get('/pending-approvals',    protect, getPendingApprovals);
router.get('/all',                  protect, getAllSubmissions);
router.get('/stats',                protect, getDashboardStats);

router.get('/:id/preview',           protect, previewSubmission);
router.post('/:id/reanalyse',        protect, reanalyseSubmission);

router.put('/:id/grade',             protect, gradeSubmission);

// Kept for compatibility, but now this is PRE-APPROVAL DECISION ONLY.
// It does not publish marks and does not save rubric marks.
router.patch('/:id/mark-and-decide', protect, markAndDecide);

router.patch('/:id/approve',         protect, approveSubmission);
router.patch('/:id/reject',          protect, rejectSubmission);

router.post('/:id/request-regrade',  protect, requestRegrade);
router.post('/:id/regrade-request',  protect, requestRegrade);
router.put('/:id/accept-regrade',    protect, acceptRegrade);

router.put('/:id',                   protect, upload.single('file'), updateSubmission);
router.delete('/:id',                protect, deleteSubmission);
router.get('/:id',                   protect, getSubmission);

module.exports = router;
