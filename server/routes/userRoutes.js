const express  = require('express');
const router   = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  getAllStudents,
  uploadProfilePicture,
  removeProfilePicture
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Make sure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, `profile_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Images only!'));
  }
});

router.get('/profile',          protect, getProfile);
router.put('/profile',          protect, updateProfile);
router.put('/update-password',  protect, updatePassword);
router.get('/students',         protect, authorize('lecturer'), getAllStudents);
router.put('/profile/picture',  protect, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile/picture', protect, removeProfilePicture);

module.exports = router;