const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving ─────────────────────
app.use('/uploads',     express.static(path.join(__dirname, 'uploads')));
app.use('/submissions', express.static(path.join(__dirname, 'submissions')));

// ── MongoDB ─────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ── Routes ──────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/user',          require('./routes/userRoutes'));
app.use('/api/submissions',   require('./routes/submissionRoutes'));
app.use('/api/assignments',   require('./routes/assignmentRoutes'));
app.use('/api/ai',            require('./routes/Airoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // ← NEW

// ── Health check ────────────────────────────
app.get('/', (req, res) => res.json({ message: '🚀 Mentora API is running!' }));

// ── ONE-TIME FIX: normalize old absolute filePaths in DB ────────────────────
// Visit http://localhost:5000/fix-paths ONCE, then DELETE this route
app.get('/fix-paths', async (req, res) => {
  const Submission = require('./models/Submission');
  const submissions = await Submission.find({});
  let fixed = 0;
  for (const sub of submissions) {
    if (sub.filePath && (sub.filePath.includes('\\') || sub.filePath.includes(':/') || sub.filePath.startsWith('/'))) {
      const filename = sub.filePath.replace(/\\/g, '/').split('/').pop();
      sub.filePath = `submissions/${filename}`;
      await sub.save();
      fixed++;
    }
  }
  res.json({ message: `✅ Fixed ${fixed} records` });
});
// ── END ONE-TIME FIX ─────────────────────────

// ── 404 ─────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));