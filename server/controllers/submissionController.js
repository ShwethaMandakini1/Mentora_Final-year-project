const Submission             = require('../models/Submission');
const Assignment             = require('../models/Assignment');
const { createNotification } = require('../services/notificationService');
const fs                     = require('fs');
const path                   = require('path');
const { extractText }        = require('../services/fileParserService');
const { analyseSubmission }  = require('../services/gradeService');

// ── Helper: run AI analysis in background ─────────────────────────────────────
const runAIAnalysis = async (submissionId, filePath, assignmentName, moduleCode, moduleName, rubric = [], context = '') => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out after 60 seconds')), 60000)
    );
    await Promise.race([
      (async () => {
        const text = await extractText(filePath);
        console.log(`Extracted ${text?.trim().length || 0} chars from file`);
        if (!text || text.trim().length < 20) {
          await Submission.findByIdAndUpdate(submissionId, {
            aiAnalysis: { status: 'failed', message: 'Could not extract text from file.' }
          });
          return;
        }
        const analysis = await analyseSubmission({ text, assignmentName, moduleCode, moduleName, rubric, context });
        await Submission.findByIdAndUpdate(submissionId, {
          aiAnalysis: { status: 'done', ...analysis, analysedAt: new Date() }
        });
        console.log(`✅ AI analysis done for submission ${submissionId}`);
      })(),
      timeoutPromise
    ]);
  } catch (err) {
    console.error('AI analysis background error:', err.message);
    await Submission.findByIdAndUpdate(submissionId, {
      aiAnalysis: { status: 'failed', message: err.message }
    });
  }
};

// ── Helper: attach assignment rubric to submissions ───────────────────────────
const attachRubrics = async (submissions) => {
  const names       = [...new Set(submissions.map(s => s.assignmentName).filter(Boolean))];
  const assignments = await Assignment.find({ title: { $in: names } }).lean();
  const map         = {};
  assignments.forEach(a => { map[a.title] = a.rubric || []; });
  return submissions.map(s => ({
    ...s.toObject ? s.toObject() : s,
    assignmentRubric: map[s.assignmentName] || [],
  }));
};

// ── SUBMIT assignment (student) ───────────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { moduleCode, moduleName, assignmentName, instructions, description } = req.body;

    let rubric = [];
    try { rubric = JSON.parse(req.body.rubric || '[]'); } catch {}

    const sub = await Submission.create({
      student:        req.user._id,
      moduleCode:     moduleCode     || 'PUSL2345',
      moduleName:     moduleName     || 'General',
      assignmentName: assignmentName || req.file.originalname,
      fileName:       req.file.originalname,
      filePath:       `submissions/${req.file.filename}`,
      fileType:       req.file.mimetype,
      aiAnalysis:     { status: 'pending' },
    });

    const context = [
      description  ? `Assignment Description: ${description}`  : '',
      instructions ? `Lecturer Instructions: ${instructions}` : '',
    ].filter(Boolean).join('\n');

    runAIAnalysis(
      sub._id,
      `submissions/${req.file.filename}`,
      assignmentName || req.file.originalname,
      moduleCode     || '',
      moduleName     || '',
      rubric,
      context
    );

    res.status(201).json({ success: true, submission: sub });
  } catch (err) {
    console.error('SUBMIT ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET my submissions (student) ──────────────────────────────────────────────
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission
      .find({ student: req.user._id })
      .sort({ submittedAt: -1 });
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET all submissions (lecturer) ────────────────────────────────────────────
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission
      .find()
      .populate('student', 'username email studentId')
      .sort({ submittedAt: -1 });

    const withRubrics = await attachRubrics(submissions);
    res.json({ success: true, submissions: withRubrics });
  } catch (err) {
    console.error('GET ALL SUBMISSIONS ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single submission ─────────────────────────────────────────────────────
exports.getSubmission = async (req, res) => {
  try {
    const sub = await Submission
      .findById(req.params.id)
      .populate('student', 'username email studentId');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GRADE submission (lecturer) ───────────────────────────────────────────────
// Triggers a "marks_received" notification when the grade is published.
exports.gradeSubmission = async (req, res) => {
  try {
    const { score, grade, feedback, rubricScores, published, corrections } = req.body;

    // Fetch existing submission to check previous published state
    const existing = await Submission.findById(req.params.id).populate('student', 'username email');
    if (!existing) return res.status(404).json({ success: false, message: 'Submission not found' });

    const wasAlreadyPublished = existing.published === true;

    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        score, grade, feedback, rubricScores,
        status:   'Graded',
        lecturer: req.user._id,
        gradedAt: new Date(),
        ...(published   && { published: true }),
        ...(corrections && { corrections }),
      },
      { new: true }
    ).populate('student', 'username email');

    // ── Notify student when marks are published for the first time ───────────
    if (published && !wasAlreadyPublished && sub.student?._id) {
      const scoreText  = score != null ? `You scored ${score}%` : '';
      const gradeText  = grade         ? ` (${grade})`          : '';
      await createNotification({
        userId:  sub.student._id,
        type:    'marks_received',
        title:   'Marks Received',
        message: `Your marks for "${sub.assignmentName}"${sub.moduleCode ? ` in ${sub.moduleCode}` : ''} have been released.${scoreText ? ' ' + scoreText + gradeText + '.' : ''}`,
        meta:    {
          submissionId:   sub._id,
          assignmentName: sub.assignmentName,
          moduleCode:     sub.moduleCode,
          score,
          grade,
        },
      });
    }

    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ACCEPT regrade request (lecturer) ────────────────────────────────────────
// Call this when the lecturer reviews and accepts the regrade.
// If you have a dedicated regrade endpoint, add this notification there too.
exports.acceptRegrade = async (req, res) => {
  try {
    const { score, grade, feedback } = req.body;

    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        score, grade, feedback,
        status:    'Graded',
        gradedAt:  new Date(),
        published: true,
        regrade:   { status: 'accepted', reviewedAt: new Date() },
      },
      { new: true }
    ).populate('student', 'username email');

    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    // ── Notify the student ────────────────────────────────────────────────────
    if (sub.student?._id) {
      const scoreText = score != null ? `New score: ${score}%` : '';
      const gradeText = grade         ? ` (${grade})`          : '';
      await createNotification({
        userId:  sub.student._id,
        type:    'regrade_accepted',
        title:   'Re-grade Request Accepted',
        message: `Your re-grade request for "${sub.assignmentName}"${sub.moduleCode ? ` in ${sub.moduleCode}` : ''} has been accepted.${scoreText ? ' ' + scoreText + gradeText + '.' : ''}`,
        meta:    {
          submissionId:   sub._id,
          assignmentName: sub.assignmentName,
          moduleCode:     sub.moduleCode,
          score,
          grade,
        },
      });
    }

    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── RE-ANALYSE submission (lecturer triggers manually) ────────────────────────
exports.reanalyseSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    let rubric  = [];
    let context = '';
    try {
      const assignment = await Assignment.findOne({ title: sub.assignmentName });
      if (assignment) {
        rubric  = assignment.rubric || [];
        context = [
          assignment.description  ? `Assignment Description: ${assignment.description}`  : '',
          assignment.instructions ? `Lecturer Instructions: ${assignment.instructions}` : '',
        ].filter(Boolean).join('\n');
      }
    } catch {}

    await Submission.findByIdAndUpdate(req.params.id, {
      aiAnalysis: { status: 'pending' }
    });

    runAIAnalysis(
      sub._id,
      sub.filePath,
      sub.assignmentName,
      sub.moduleCode,
      sub.moduleName,
      rubric,
      context
    );

    res.json({ success: true, message: 'Re-analysis started. Refresh in a few seconds.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE submission (student - edit/replace file) ───────────────────────────
exports.updateSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub)
      return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });

    if (req.file) {
      if (sub.filePath) {
        const oldAbsolute = path.join(__dirname, '..', sub.filePath);
        if (fs.existsSync(oldAbsolute)) fs.unlinkSync(oldAbsolute);
      }
      sub.fileName   = req.file.originalname;
      sub.filePath   = `submissions/${req.file.filename}`;
      sub.fileType   = req.file.mimetype;
      sub.aiAnalysis = { status: 'pending' };

      let rubric = [];
      try { rubric = JSON.parse(req.body.rubric || '[]'); } catch {}
      const context = [
        req.body.description  ? `Assignment Description: ${req.body.description}`  : '',
        req.body.instructions ? `Lecturer Instructions: ${req.body.instructions}` : '',
      ].filter(Boolean).join('\n');

      runAIAnalysis(
        sub._id,
        `submissions/${req.file.filename}`,
        sub.assignmentName,
        sub.moduleCode,
        sub.moduleName,
        rubric,
        context
      );
    }

    sub.status   = 'Pending';
    sub.score    = undefined;
    sub.grade    = undefined;
    sub.feedback = undefined;
    sub.gradedAt = undefined;
    await sub.save();

    res.json({ success: true, message: 'Submission updated successfully', submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE submission (student) ───────────────────────────────────────────────
exports.deleteSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub)
      return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });

    if (sub.filePath) {
      const absPath = path.join(__dirname, '..', sub.filePath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }
    await sub.deleteOne();
    res.json({ success: true, message: 'Submission removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET dashboard stats (student) ─────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id });
    const graded      = submissions.filter(s => s.status === 'Graded');
    const total       = submissions.length;
    const pending     = submissions.filter(s => s.status === 'Pending').length;

    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((a, s) => a + (Number(s.score) || 0), 0) / graded.length)
      : 0;

    const getGrade = p => {
      if (p >= 90) return 'A+'; if (p >= 85) return 'A';  if (p >= 80) return 'A-';
      if (p >= 75) return 'B+'; if (p >= 70) return 'B';  if (p >= 65) return 'B-';
      if (p >= 60) return 'C+'; if (p >= 55) return 'C';  return 'F';
    };

    const moduleMap = {};
    for (const s of graded) {
      const key = s.moduleCode || 'Unknown';
      if (!moduleMap[key]) moduleMap[key] = { moduleCode: key, moduleName: s.moduleName || key, scores: [] };
      moduleMap[key].scores.push(Number(s.score) || 0);
    }
    const modules = Object.values(moduleMap).map(m => {
      const avg = Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length);
      return { moduleCode: m.moduleCode, moduleName: m.moduleName, average: avg, grade: getGrade(avg) };
    });

    const bestModule = modules.length > 0
      ? modules.reduce((best, m) => m.average > best.average ? m : best, modules[0])
      : null;

    res.json({
      success: true,
      stats: { average: avgScore, grade: getGrade(avgScore), total, graded: graded.length, pending, modules, bestModule },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};