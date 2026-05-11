const Submission             = require('../models/Submission');
const Assignment             = require('../models/Assignment');
const User                   = require('../models/User');
const { createNotification } = require('../services/notificationService');
const fs                     = require('fs');
const path                   = require('path');
const { extractText }        = require('../services/fileParserService');
const { analyseSubmission }  = require('../services/gradeService');
const mammoth                = require('mammoth');

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

// ── Helper: increment submissionsUsed safely ──────────────────────────────────
const incrementSubmissionsUsed = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'subscription.submissionsUsed': 1 }
    });
  } catch (err) {
    console.error('⚠️ Failed to increment submissionsUsed:', err.message);
  }
};

// ── Helper: check submission limit ───────────────────────────────────────────
const checkSubmissionLimit = async (userId) => {
  const user = await User.findById(userId).select('subscription');
  if (!user) return { allowed: false, message: 'User not found' };

  const plan   = user.subscription?.plan   || 'free';
  const limit  = user.subscription?.submissionsLimit ?? 10;
  const used   = user.subscription?.submissionsUsed  ?? 0;
  const status = user.subscription?.status || 'active';

  // Institution and pro with limit 999 = unlimited
  if (limit >= 999) return { allowed: true };

  // Check if subscription is expired
  const endDate = user.subscription?.endDate;
  if (endDate && new Date(endDate) < new Date() && plan !== 'free') {
    return { allowed: false, message: 'Your subscription has expired. Please renew to continue submitting.' };
  }

  if (used >= limit) {
    return {
      allowed: false,
      message: `You have reached your ${limit} submission limit for the ${plan} plan. Please upgrade to continue.`
    };
  }

  return { allowed: true };
};

// ── SUBMIT assignment (student) ───────────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // ── Check subscription limit ──────────────────────────────────────────
    const limitCheck = await checkSubmissionLimit(req.user._id);
    if (!limitCheck.allowed) {
      // Clean up uploaded file
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: limitCheck.message });
    }

    const { moduleCode, moduleName, assignmentName, assignmentId, instructions, description } = req.body;

    let rubric = [];
    try { rubric = JSON.parse(req.body.rubric || '[]'); } catch {}

    const sub = await Submission.create({
      student:        req.user._id,
      assignment:     assignmentId || undefined,
      moduleCode:     moduleCode     || 'PUSL2345',
      moduleName:     moduleName     || 'General',
      assignmentName: assignmentName || req.file.originalname,
      fileName:       req.file.originalname,
      filePath:       `submissions/${req.file.filename}`,
      fileType:       req.file.mimetype,
      aiAnalysis:     { status: 'pending' },
    });

    // ── Increment usage counter ───────────────────────────────────────────
    await incrementSubmissionsUsed(req.user._id);

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

    // IMPORTANT: student reports need the assignment rubric too.
    // This lets StudentReports show lecturer-created criteria even before
    // criterion marks are saved into submission.rubricScores.
    const withRubrics = await attachRubrics(submissions);

    res.json({ success: true, submissions: withRubrics });
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

    const withRubrics = await attachRubrics([sub]);

    res.json({ success: true, submission: withRubrics[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GRADE submission (lecturer) ───────────────────────────────────────────────
exports.gradeSubmission = async (req, res) => {
  try {
    const { score, grade, feedback, rubricScores, published, corrections } = req.body;
    const isPublishing = published === true;

    const existing = await Submission
      .findById(req.params.id)
      .populate('student', 'username email');
    if (!existing) return res.status(404).json({ success: false, message: 'Submission not found' });

    const wasAlreadyPublished = existing.published === true;

    let parsedRubricScores = [];
    if (Array.isArray(rubricScores) && rubricScores.length > 0) {
      parsedRubricScores = rubricScores.map(r => ({
        criterion:  r.criterion  || '',
        score:      Number(r.score)    || 0,
        maxScore:   Number(r.maxScore) || 0,
        percentage: r.maxScore > 0
          ? Math.round((Number(r.score) / Number(r.maxScore)) * 100)
          : 0,
      }));
    }

    const updateData = {
      score:        Number(score) || 0,
      grade:        grade        || '',
      feedback:     feedback     || '',
      rubricScores: parsedRubricScores,
      lecturer:     req.user._id,
      ...(corrections && { corrections }),
    };

    if (isPublishing && !wasAlreadyPublished) {
      updateData.status    = 'Graded';
      updateData.published = true;
      updateData.gradedAt  = new Date();
    }

    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('student', 'username email');

    if (isPublishing && !wasAlreadyPublished && sub.student?._id) {
      const scoreText = score != null ? `You scored ${score}%` : '';
      const gradeText = grade         ? ` (${grade})`          : '';
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
    console.error('GRADE ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ACCEPT regrade request (lecturer) ────────────────────────────────────────
exports.acceptRegrade = async (req, res) => {
  try {
    const { score, grade, feedback, rubricScores } = req.body;

    let parsedRubricScores = [];
    if (Array.isArray(rubricScores) && rubricScores.length > 0) {
      parsedRubricScores = rubricScores.map(r => ({
        criterion:  r.criterion  || '',
        score:      Number(r.score)    || 0,
        maxScore:   Number(r.maxScore) || 0,
        percentage: r.maxScore > 0
          ? Math.round((Number(r.score) / Number(r.maxScore)) * 100)
          : 0,
      }));
    }

    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        score:        Number(score) || 0,
        grade:        grade        || '',
        feedback:     feedback     || '',
        rubricScores: parsedRubricScores,
        status:       'Graded',
        published:    true,
        gradedAt:     new Date(),
        regrade:      { status: 'accepted', reviewedAt: new Date() },
      },
      { new: true }
    ).populate('student', 'username email');

    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

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

// ── RE-ANALYSE submission ─────────────────────────────────────────────────────
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

// ── UPDATE submission (student - edit/replace file before deadline) ────────────
// FIX: Removed the approvalStatus === 'approved' requirement.
//      Students can edit/replace their submission before the deadline regardless of approval status.
//      The same submission document is updated in-place — no new document created.
exports.updateSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub)
      return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });

    // ── If a new file is provided, swap it out ─────────────────────────────
    if (req.file) {
      // Delete the old file from disk
      if (sub.filePath) {
        const oldAbsolute = path.join(__dirname, '..', sub.filePath);
        if (fs.existsSync(oldAbsolute)) {
          try { fs.unlinkSync(oldAbsolute); } catch (e) { console.warn('Could not delete old file:', e.message); }
        }
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

    // ── Reset grading fields since it's a new file ────────────────────────
    sub.status       = 'Pending';
    sub.published    = false;
    sub.score        = undefined;
    sub.grade        = undefined;
    sub.feedback     = undefined;
    sub.gradedAt     = undefined;
    sub.rubricScores = [];
    // Keep submittedAt as the ORIGINAL date — update only updatedAt via timestamps
    // sub.submittedAt is intentionally NOT updated so history stays consistent

    await sub.save();

    // ── Notify lecturers about the updated submission ──────────────────────
    try {
      const lecturers = await User.find({ role: 'lecturer' });
      for (const lecturer of lecturers) {
        await createNotification({
          userId:  lecturer._id,
          type:    'approval_requested',
          title:   'Submission Updated',
          message: `A student updated their submission for "${sub.assignmentName}" (${sub.moduleCode}). Ready to mark.`,
          meta:    { submissionId: sub._id, assignmentName: sub.assignmentName, moduleCode: sub.moduleCode },
        });
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error (non-fatal):', notifErr.message);
    }

    res.json({ success: true, message: 'Submission updated successfully.', submission: sub });
  } catch (err) {
    console.error('UPDATE SUBMISSION ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE submission (student) ───────────────────────────────────────────────
// FIX: Deletes the submission document AND the file from disk cleanly.
exports.deleteSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub)
      return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });

    // Delete physical file
    if (sub.filePath) {
      const absPath = path.join(__dirname, '..', sub.filePath);
      if (fs.existsSync(absPath)) {
        try { fs.unlinkSync(absPath); } catch (e) { console.warn('Could not delete file:', e.message); }
      }
    }

    await sub.deleteOne();

    // ── Decrement submissionsUsed so student gets the slot back ───────────
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'subscription.submissionsUsed': -1 }
      });
    } catch (e) { console.warn('Could not decrement submissionsUsed:', e.message); }

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

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-APPROVAL WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════════

// ── SUBMIT for approval (student) ─────────────────────────────────────────────
exports.submitForApproval = async (req, res) => {
  try {
    console.log('📥 submitForApproval called');
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { moduleCode, moduleName, assignmentName, instructions, description } = req.body;

    let rubric = [];
    try { rubric = JSON.parse(req.body.rubric || '[]'); } catch {}

    const sub = await Submission.create({
      student:        req.user._id,
      moduleCode:     moduleCode     || 'GENERAL',
      moduleName:     moduleName     || assignmentName || 'General',
      assignmentName: assignmentName || req.file.originalname,
      fileName:       req.file.originalname,
      filePath:       `submissions/${req.file.filename}`,
      fileType:       req.file.mimetype,
      aiAnalysis:     { status: 'pending' },
      approvalStatus: 'pending_review',
    });

    console.log('✅ Submission created:', sub._id);

    try {
      const lecturers = await User.find({ role: 'lecturer' });
      for (const lecturer of lecturers) {
        await createNotification({
          userId:  lecturer._id,
          type:    'approval_requested',
          title:   'New Assignment Pending Review',
          message: `A student submitted "${sub.assignmentName}" for your review.`,
          meta:    { submissionId: sub._id, assignmentName: sub.assignmentName },
        });
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error (non-fatal):', notifErr.message);
    }

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
    console.error('❌ SUBMIT FOR APPROVAL ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET pending approvals (lecturer) ─────────────────────────────────────────
exports.getPendingApprovals = async (req, res) => {
  try {
    const submissions = await Submission
      .find({ approvalStatus: 'pending_review' })
      .populate('student', 'username email studentId')
      .sort({ submittedAt: -1 });

    res.json({ success: true, submissions });
  } catch (err) {
    console.error('GET PENDING APPROVALS ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── APPROVE submission (lecturer) ─────────────────────────────────────────────
exports.approveSubmission = async (req, res) => {
  try {
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: 'approved',
        approvedAt:     new Date(),
        status:         'Pending',
      },
      { new: true }
    ).populate('student', 'username email');

    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    try {
      await createNotification({
        userId:  sub.student._id,
        type:    'submission_approved',
        title:   'Assignment Approved',
        message: `Your assignment "${sub.assignmentName}" has been approved and is now in the marking queue.`,
        meta:    { submissionId: sub._id, assignmentName: sub.assignmentName },
      });
    } catch (notifErr) {
      console.error('⚠️ Notification error (non-fatal):', notifErr.message);
    }

    res.json({ success: true, submission: sub });
  } catch (err) {
    console.error('APPROVE ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REJECT submission (lecturer) ──────────────────────────────────────────────
exports.rejectSubmission = async (req, res) => {
  try {
    const { feedback } = req.body;

    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus:   'rejected',
        approvalFeedback: feedback || 'Your submission needs revision.',
        rejectedAt:       new Date(),
        status:           'Rejected',
      },
      { new: true }
    ).populate('student', 'username email');

    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    try {
      await createNotification({
        userId:  sub.student._id,
        type:    'submission_rejected',
        title:   'Assignment Needs Revision',
        message: `Your assignment "${sub.assignmentName}" was not approved. Reason: ${feedback || 'Please revise and resubmit.'}`,
        meta:    { submissionId: sub._id, assignmentName: sub.assignmentName, feedback },
      });
    } catch (notifErr) {
      console.error('⚠️ Notification error (non-fatal):', notifErr.message);
    }

    res.json({ success: true, submission: sub });
  } catch (err) {
    console.error('REJECT ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REQUEST regrade (student) ─────────────────────────────────────────────────
exports.requestRegrade = async (req, res) => {
  try {
    const { reason } = req.body;

    const sub = await Submission.findById(req.params.id)
      .populate('student', 'username email studentId');
    if (!sub)
      return res.status(404).json({ success: false, message: 'Submission not found' });

    if (sub.student._id.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });

    await Submission.findByIdAndUpdate(req.params.id, {
      regrade: { status: 'pending', reason: reason || '', requestedAt: new Date() },
    });

    try {
      const lecturers = await User.find({ role: 'lecturer' });
      for (const lecturer of lecturers) {
        await createNotification({
          userId:  lecturer._id,
          type:    'regrade_requested',
          title:   'Re-grade Request',
          message: `${sub.student.username || 'A student'} requested a re-grade for "${sub.assignmentName}"${sub.moduleCode ? ` (${sub.moduleCode})` : ''}.${reason ? ` Reason: ${reason}` : ''}`,
          meta: {
            submissionId:   sub._id,
            assignmentName: sub.assignmentName,
            moduleCode:     sub.moduleCode,
            studentName:    sub.student.username,
            reason,
          },
        });
      }
    } catch (notifErr) {
      console.error('⚠️ Regrade notification error (non-fatal):', notifErr.message);
    }

    res.json({ success: true, message: 'Re-grade request submitted.' });
  } catch (err) {
    console.error('REQUEST REGRADE ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PREVIEW submission document ───────────────────────────────────────────────
exports.previewSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    const filePath = path.join(__dirname, '..', sub.filePath);
    const ext      = path.extname(filePath).toLowerCase();

    let text = '';

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      return res.json({
        success:          true,
        type:             ext,
        previewAvailable: false,
        fileUrl:          `/submissions/${path.basename(filePath)}`,
        message:          'Preview not available for this file type.',
      });
    }

    res.json({
      success:          true,
      type:             ext,
      previewAvailable: true,
      text,
      fileUrl:          `/submissions/${path.basename(filePath)}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};