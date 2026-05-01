const Assignment             = require('../models/Assignment');
const User                   = require('../models/User');
const { createNotification } = require('../services/notificationService');
const path                   = require('path');
const fs                     = require('fs');

// ── Helper: parse rubric from FormData (arrives as JSON string) ───────────────
function parseRubric(raw) {
  if (!raw)               return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Helper: delete old file from disk ────────────────────────────────────────
function deleteFile(relativePath) {
  if (!relativePath) return;
  const abs = path.join(__dirname, '..', relativePath);
  fs.unlink(abs, () => {}); // silently ignore errors
}

// ── POST /api/assignments ─────────────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const body      = { ...req.body, lecturer: req.user._id };
    body.rubric     = parseRubric(req.body.rubric);

    if (req.files?.instructionFile?.[0])
      body.instructionFile = `/uploads/${req.files.instructionFile[0].filename}`;
    if (req.files?.templateFile?.[0])
      body.templateFile = `/uploads/${req.files.templateFile[0].filename}`;

    const assignment = await Assignment.create(body);

    // ── Notify all students ──────────────────────────────────────────────────
    // Find every user with role 'student' and send them a notification
    const students = await User.find({ role: 'student' }).select('_id').lean();

    const dueText = assignment.dueDate
      ? new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    await Promise.all(
      students.map(s =>
        createNotification({
          userId:  s._id,
          type:    'new_assignment',
          title:   'New Assignment Posted',
          message: `A new assignment "${assignment.title}" has been posted${assignment.moduleCode ? ` for ${assignment.moduleCode}` : ''}${dueText ? `. Due: ${dueText}` : ''}.`,
          meta:    { assignmentId: assignment._id, moduleCode: assignment.moduleCode },
        })
      )
    );

    // ── Deadline reminder notifications (if dueDate is set) ─────────────────
    // We store a second notification that acts as the deadline reminder.
    // A cron job (or a simple check on the frontend) can surface these.
    if (assignment.dueDate) {
      await Promise.all(
        students.map(s =>
          createNotification({
            userId:  s._id,
            type:    'deadline_reminder',
            title:   'Deadline Approaching',
            message: `"${assignment.title}"${assignment.moduleCode ? ` (${assignment.moduleCode})` : ''} is due on ${dueText}. Make sure to submit on time.`,
            meta:    { assignmentId: assignment._id, moduleCode: assignment.moduleCode, dueDate: assignment.dueDate },
          })
        )
      );
    }

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments ──────────────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id ──────────────────────────────────────────────────
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/assignments/:id ──────────────────────────────────────────────────
exports.updateAssignment = async (req, res) => {
  try {
    const existing  = await Assignment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    const body  = { ...req.body };
    body.rubric = parseRubric(req.body.rubric);

    if (req.files?.instructionFile?.[0]) {
      deleteFile(existing.instructionFile);
      body.instructionFile = `/uploads/${req.files.instructionFile[0].filename}`;
    }
    if (req.files?.templateFile?.[0]) {
      deleteFile(existing.templateFile);
      body.templateFile = `/uploads/${req.files.templateFile[0].filename}`;
    }

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/assignments/:id ───────────────────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });

    deleteFile(assignment.instructionFile);
    deleteFile(assignment.templateFile);

    await assignment.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};