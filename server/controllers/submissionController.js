const Submission             = require('../models/Submission');
const Assignment             = require('../models/Assignment');
const User                   = require('../models/User');
const { createNotification } = require('../services/notificationService');
const fs                     = require('fs');
const path                   = require('path');
const { extractText }        = require('../services/fileParserService');
const { analyseSubmission }  = require('../services/gradeService');
const mammoth                = require('mammoth');

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

const incrementSubmissionsUsed = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { $inc: { 'subscription.submissionsUsed': 1 } });
  } catch (err) {
    console.error('⚠️ Failed to increment submissionsUsed:', err.message);
  }
};

const checkSubmissionLimit = async (userId) => {
  const user = await User.findById(userId).select('subscription');
  if (!user) return { allowed: false, message: 'User not found' };
  const plan  = user.subscription?.plan   || 'free';
  const limit = user.subscription?.submissionsLimit ?? 10;
  const used  = user.subscription?.submissionsUsed  ?? 0;
  if (limit >= 999) return { allowed: true };
  const endDate = user.subscription?.endDate;
  if (endDate && new Date(endDate) < new Date() && plan !== 'free')
    return { allowed: false, message: 'Your subscription has expired. Please renew to continue submitting.' };
  if (used >= limit)
    return { allowed: false, message: `You have reached your ${limit} submission limit for the ${plan} plan. Please upgrade to continue.` };
  return { allowed: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → POST /submissions
// ─────────────────────────────────────────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const limitCheck = await checkSubmissionLimit(req.user._id);
    if (!limitCheck.allowed) {
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
      approvalStatus: 'draft',
    });

    await incrementSubmissionsUsed(req.user._id);

    const context = [
      description  ? `Assignment Description: ${description}`  : '',
      instructions ? `Lecturer Instructions: ${instructions}` : '',
    ].filter(Boolean).join('\n');

    runAIAnalysis(sub._id, `submissions/${req.file.filename}`, assignmentName || req.file.originalname, moduleCode || '', moduleName || '', rubric, context);
    res.status(201).json({ success: true, submission: sub });
  } catch (err) {
    console.error('SUBMIT ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → POST /submissions/submit-for-approval
// ─────────────────────────────────────────────────────────────────────────────
exports.submitForApproval = async (req, res) => {
  try {
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
      status:         'Pending',
    });

    try {
      const lecturers = await User.find({ role: 'lecturer' });
      for (const lecturer of lecturers) {
        await createNotification({
          userId:  lecturer._id,
          type:    'approval_requested',
          title:   'New Assignment Pending Review',
          message: `${req.user.username || 'A student'} submitted "${sub.assignmentName}" for pre-approval review.`,
          meta:    { submissionId: sub._id, assignmentName: sub.assignmentName },
        });
      }
    } catch (notifErr) { console.error('⚠️ Notification error (non-fatal):', notifErr.message); }

    const context = [
      description  ? `Assignment Description: ${description}`  : '',
      instructions ? `Lecturer Instructions: ${instructions}` : '',
    ].filter(Boolean).join('\n');

    runAIAnalysis(sub._id, `submissions/${req.file.filename}`, assignmentName || req.file.originalname, moduleCode || '', moduleName || '', rubric, context);
    res.status(201).json({ success: true, submission: sub });
  } catch (err) {
    console.error('❌ SUBMIT FOR APPROVAL ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER → GET /submissions/pending-approvals
// Returns all pre-approval submissions for the Pre-Approvals page
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingApprovals = async (req, res) => {
  try {
    const submissions = await Submission
      .find({ approvalStatus: { $in: ['pending_review', 'approved', 'rejected'] } })
      .populate('student', 'username email studentId')
      .sort({ submittedAt: -1 });
    const withRubrics = await attachRubrics(submissions);
    res.json({ success: true, submissions: withRubrics });
  } catch (err) {
    console.error('GET PENDING APPROVALS ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER → PATCH /submissions/:id/mark-and-decide
// ─────────────────────────────────────────────────────────────────────────────
exports.markAndDecide = async (req, res) => {
  try {
    const { decision, feedback } = req.body;
    if (!['approve', 'reject'].includes(decision))
      return res.status(400).json({ success: false, message: 'decision must be "approve" or "reject"' });
    if (!feedback?.trim())
      return res.status(400).json({ success: false, message: 'Please add a review comment before saving the decision.' });

    const existing = await Submission.findById(req.params.id).populate('student', 'username email');
    if (!existing) return res.status(404).json({ success: false, message: 'Submission not found' });

    const updateData = {
      lecturer: req.user._id, approvalFeedback: feedback.trim(),
      status: 'Pending', published: false,
    };

    if (decision === 'approve') {
      updateData.approvalStatus = 'approved';
      updateData.approvedAt     = new Date();
      updateData.rejectedAt     = undefined;
    } else {
      updateData.approvalStatus = 'rejected';
      updateData.rejectedAt     = new Date();
      updateData.approvedAt     = undefined;
    }

    const sub = await Submission.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('student', 'username email');

    if (sub.student?._id) {
      await createNotification({
        userId:  sub.student._id,
        type:    decision === 'approve' ? 'submission_approved' : 'submission_rejected',
        title:   decision === 'approve' ? '✅ Draft Approved' : '↩️ Draft Needs Revision',
        message: decision === 'approve'
          ? `Your draft for "${sub.assignmentName}" has been approved. Comment: ${feedback.trim()}`
          : `Your draft for "${sub.assignmentName}" needs revision. Comment: ${feedback.trim()}`,
        meta: { submissionId: sub._id, assignmentName: sub.assignmentName, moduleCode: sub.moduleCode },
      });
    }

    res.json({ success: true, submission: sub });
  } catch (err) {
    console.error('PRE-APPROVAL DECISION ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    const { feedback = 'Your draft has been approved.' } = req.body;
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'approved', approvalFeedback: feedback, approvedAt: new Date(), rejectedAt: undefined, status: 'Pending', published: false },
      { new: true }
    ).populate('student', 'username email');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    try { await createNotification({ userId: sub.student._id, type: 'submission_approved', title: 'Draft Approved', message: `Your draft for "${sub.assignmentName}" has been approved. Comment: ${feedback}`, meta: { submissionId: sub._id, assignmentName: sub.assignmentName } }); } catch {}
    res.json({ success: true, submission: sub });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.rejectSubmission = async (req, res) => {
  try {
    const { feedback = '' } = req.body;
    if (!feedback.trim()) return res.status(400).json({ success: false, message: 'Feedback is required when rejecting a draft.' });
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected', approvalFeedback: feedback.trim(), rejectedAt: new Date(), approvedAt: undefined, status: 'Pending', published: false },
      { new: true }
    ).populate('student', 'username email');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    try { await createNotification({ userId: sub.student._id, type: 'submission_rejected', title: 'Draft Needs Revision', message: `Your draft for "${sub.assignmentName}" needs revision. Comment: ${feedback.trim()}`, meta: { submissionId: sub._id, assignmentName: sub.assignmentName, feedback: feedback.trim() } }); } catch {}
    res.json({ success: true, submission: sub });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → GET /submissions/my
// ─────────────────────────────────────────────────────────────────────────────
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id }).sort({ submittedAt: -1 });
    const withRubrics = await attachRubrics(submissions);
    res.json({ success: true, submissions: withRubrics });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER → GET /submissions/all
//
// Marking & Feedback ONLY shows direct submissions from the Assignments tab.
// These always have approvalStatus === 'draft'.
//
// Pre-approval submissions (pending_review / approved / rejected) belong
// exclusively to the Pre-Approvals page and must NEVER appear here.
//
// Flow summary:
//   Pre-Approval tab  → submitForApproval → approvalStatus: 'pending_review'
//                     → lecturer approves → approvalStatus: 'approved'
//                     → shown in Pre-Approvals page ONLY
//
//   Assignments tab   → submit            → approvalStatus: 'draft'
//                     → shown in Marking & Feedback ONLY
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission
      .find({ approvalStatus: { $nin: ['pending_review', 'approved', 'rejected'] } })
      .populate('student', 'username email studentId')
      .sort({ submittedAt: -1 });

    const withRubrics = await attachRubrics(submissions);
    res.json({ success: true, submissions: withRubrics });
  } catch (err) {
    console.error('GET ALL SUBMISSIONS ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET → /submissions/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).populate('student', 'username email studentId');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    const withRubrics = await attachRubrics([sub]);
    res.json({ success: true, submission: withRubrics[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER → PUT /submissions/:id/grade
// ─────────────────────────────────────────────────────────────────────────────
exports.gradeSubmission = async (req, res) => {
  try {
    const { score, grade, feedback, rubricScores, published, corrections } = req.body;
    const isPublishing = published === true;

    const existing = await Submission.findById(req.params.id).populate('student', 'username email');
    if (!existing) return res.status(404).json({ success: false, message: 'Submission not found' });

    if (existing.approvalStatus === 'pending_review') {
      return res.status(400).json({ success: false, message: 'This submission is still in the pre-approval queue and cannot be graded yet.' });
    }

    const wasAlreadyPublished = existing.published === true;

    let parsedRubricScores = [];
    if (Array.isArray(rubricScores) && rubricScores.length > 0) {
      parsedRubricScores = rubricScores.map(r => ({
        criterion: r.criterion || '', score: Number(r.score) || 0, maxScore: Number(r.maxScore) || 0,
        percentage: r.maxScore > 0 ? Math.round((Number(r.score) / Number(r.maxScore)) * 100) : 0,
      }));
    }

    const updateData = {
      score: Number(score) || 0, grade: grade || '', feedback: feedback || '',
      rubricScores: parsedRubricScores, lecturer: req.user._id,
      ...(corrections && { corrections }),
    };

    if (isPublishing && !wasAlreadyPublished) {
      updateData.status    = 'Graded';
      updateData.published = true;
      updateData.gradedAt  = new Date();
    }

    const sub = await Submission.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('student', 'username email');

    if (isPublishing && !wasAlreadyPublished && sub.student?._id) {
      const scoreText = score != null ? `You scored ${score}%` : '';
      const gradeText = grade ? ` (${grade})` : '';
      await createNotification({
        userId:  sub.student._id,
        type:    'marks_received',
        title:   'Your Marks Are Ready 🎉',
        message: `Your marks for "${sub.assignmentName}"${sub.moduleCode ? ` in ${sub.moduleCode}` : ''} have been released.${scoreText ? ' ' + scoreText + gradeText + '.' : ''}`,
        meta:    { submissionId: sub._id, assignmentName: sub.assignmentName, moduleCode: sub.moduleCode, score, grade },
      });
    }

    res.json({ success: true, submission: sub });
  } catch (err) {
    console.error('GRADE ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER → PUT /submissions/:id/accept-regrade
// ─────────────────────────────────────────────────────────────────────────────
exports.acceptRegrade = async (req, res) => {
  try {
    const { score, grade, feedback, rubricScores } = req.body;
    let parsedRubricScores = [];
    if (Array.isArray(rubricScores) && rubricScores.length > 0) {
      parsedRubricScores = rubricScores.map(r => ({
        criterion: r.criterion || '', score: Number(r.score) || 0, maxScore: Number(r.maxScore) || 0,
        percentage: r.maxScore > 0 ? Math.round((Number(r.score) / Number(r.maxScore)) * 100) : 0,
      }));
    }
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { score: Number(score) || 0, grade: grade || '', feedback: feedback || '', rubricScores: parsedRubricScores, status: 'Graded', published: true, gradedAt: new Date(), regrade: { status: 'accepted', reviewedAt: new Date() } },
      { new: true }
    ).populate('student', 'username email');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student?._id) {
      const scoreText = score != null ? `New score: ${score}%` : '';
      const gradeText = grade ? ` (${grade})` : '';
      await createNotification({ userId: sub.student._id, type: 'regrade_accepted', title: 'Re-grade Request Accepted', message: `Your re-grade request for "${sub.assignmentName}" has been accepted.${scoreText ? ' ' + scoreText + gradeText + '.' : ''}`, meta: { submissionId: sub._id, assignmentName: sub.assignmentName, moduleCode: sub.moduleCode, score, grade } });
    }
    res.json({ success: true, submission: sub });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURER → POST /submissions/:id/reanalyse
// ─────────────────────────────────────────────────────────────────────────────
exports.reanalyseSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    let rubric = [], context = '';
    try {
      const assignment = await Assignment.findOne({ title: sub.assignmentName });
      if (assignment) {
        rubric  = assignment.rubric || [];
        context = [assignment.description ? `Assignment Description: ${assignment.description}` : '', assignment.instructions ? `Lecturer Instructions: ${assignment.instructions}` : ''].filter(Boolean).join('\n');
      }
    } catch {}
    await Submission.findByIdAndUpdate(req.params.id, { aiAnalysis: { status: 'pending' } });
    runAIAnalysis(sub._id, sub.filePath, sub.assignmentName, sub.moduleCode, sub.moduleName, rubric, context);
    res.json({ success: true, message: 'Re-analysis started. Refresh in a few seconds.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → PUT /submissions/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });

    if (req.file) {
      if (sub.filePath) {
        const oldAbsolute = path.join(__dirname, '..', sub.filePath);
        if (fs.existsSync(oldAbsolute)) { try { fs.unlinkSync(oldAbsolute); } catch (e) {} }
      }
      sub.fileName   = req.file.originalname;
      sub.filePath   = `submissions/${req.file.filename}`;
      sub.fileType   = req.file.mimetype;
      sub.aiAnalysis = { status: 'pending' };
      let rubric = [];
      try { rubric = JSON.parse(req.body.rubric || '[]'); } catch {}
      const context = [req.body.description ? `Assignment Description: ${req.body.description}` : '', req.body.instructions ? `Lecturer Instructions: ${req.body.instructions}` : ''].filter(Boolean).join('\n');
      runAIAnalysis(sub._id, `submissions/${req.file.filename}`, sub.assignmentName, sub.moduleCode, sub.moduleName, rubric, context);
    }

    sub.status = 'Pending'; sub.published = false; sub.score = undefined;
    sub.grade = undefined; sub.feedback = undefined; sub.gradedAt = undefined;
    sub.rubricScores = [];
    // FIX: Keep the original approvalStatus — don't override 'draft' with 'pending_review'.
    // Direct submissions (Assignments tab) stay as 'draft' so they remain in Marking & Feedback.
    // Only pre-approval submissions should ever be 'pending_review'.
    if (!sub.approvalStatus || sub.approvalStatus === 'draft') {
      sub.approvalStatus = 'draft';  // direct submission — stays in Marking & Feedback
    }
    // If it was a pre-approval submission being revised, keep it in the review queue
    // (approvalStatus stays as-is: 'pending_review' / 'rejected')
    await sub.save();

    // Only notify lecturers if this is a pre-approval revision
    if (sub.approvalStatus === 'pending_review') {
      try {
        const lecturers = await User.find({ role: 'lecturer' });
        for (const lecturer of lecturers) {
          await createNotification({ userId: lecturer._id, type: 'approval_requested', title: 'Submission Revised — Needs Review', message: `A student revised their submission for "${sub.assignmentName}" (${sub.moduleCode}). Please re-review.`, meta: { submissionId: sub._id, assignmentName: sub.assignmentName, moduleCode: sub.moduleCode } });
        }
      } catch (notifErr) { console.error('⚠️ Notification error:', notifErr.message); }
    }

    res.json({ success: true, message: 'Submission updated successfully.', submission: sub });
  } catch (err) {
    console.error('UPDATE SUBMISSION ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → DELETE /submissions/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });
    if (sub.filePath) {
      const absPath = path.join(__dirname, '..', sub.filePath);
      if (fs.existsSync(absPath)) { try { fs.unlinkSync(absPath); } catch (e) {} }
    }
    await sub.deleteOne();
    try { await User.findByIdAndUpdate(req.user._id, { $inc: { 'subscription.submissionsUsed': -1 } }); } catch (e) {}
    res.json({ success: true, message: 'Submission removed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → GET /submissions/stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student:        req.user._id,
      approvalStatus: { $nin: ['pending_review', 'rejected'] },
    });
    const graded  = submissions.filter(s => s.status === 'Graded' && s.published === true);
    const total   = submissions.length;
    const pending = submissions.filter(s => s.status === 'Pending').length;
    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((a, s) => a + (Number(s.score) || 0), 0) / graded.length) : 0;
    const getGrade = p => { if (p>=90)return'A+';if(p>=85)return'A';if(p>=80)return'A-';if(p>=75)return'B+';if(p>=70)return'B';if(p>=65)return'B-';if(p>=60)return'C+';if(p>=55)return'C';return'F'; };
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
    const bestModule = modules.length > 0 ? modules.reduce((best, m) => m.average > best.average ? m : best, modules[0]) : null;
    res.json({ success: true, stats: { average: avgScore, grade: getGrade(avgScore), total, graded: graded.length, pending, modules, bestModule } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT → POST /submissions/:id/request-regrade
// ─────────────────────────────────────────────────────────────────────────────
exports.requestRegrade = async (req, res) => {
  try {
    const { reason } = req.body;
    const sub = await Submission.findById(req.params.id).populate('student', 'username email studentId');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student._id.toString() !== req.user._id.toString())
      return res.status(401).json({ success: false, message: 'Not authorised' });
    await Submission.findByIdAndUpdate(req.params.id, { regrade: { status: 'pending', reason: reason || '', requestedAt: new Date() } });
    try {
      const lecturers = await User.find({ role: 'lecturer' });
      for (const lecturer of lecturers) {
        await createNotification({ userId: lecturer._id, type: 'regrade_requested', title: 'Re-grade Request', message: `${sub.student.username || 'A student'} requested a re-grade for "${sub.assignmentName}"${sub.moduleCode ? ` (${sub.moduleCode})` : ''}.${reason ? ` Reason: ${reason}` : ''}`, meta: { submissionId: sub._id, assignmentName: sub.assignmentName, moduleCode: sub.moduleCode, studentName: sub.student.username, reason } });
      }
    } catch (notifErr) { console.error('⚠️ Regrade notification error:', notifErr.message); }
    res.json({ success: true, message: 'Re-grade request submitted.' });
  } catch (err) {
    console.error('REQUEST REGRADE ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET → /submissions/:id/preview
// ─────────────────────────────────────────────────────────────────────────────
exports.previewSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    const filePath = path.join(__dirname, '..', sub.filePath);
    const ext      = path.extname(filePath).toLowerCase();
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return res.json({ success: true, type: ext, previewAvailable: true, text: result.value, fileUrl: `/submissions/${path.basename(filePath)}` });
    }
    if (ext === '.txt') {
      const text = fs.readFileSync(filePath, 'utf8');
      return res.json({ success: true, type: ext, previewAvailable: true, text, fileUrl: `/submissions/${path.basename(filePath)}` });
    }
    res.json({ success: true, type: ext, previewAvailable: false, fileUrl: `/submissions/${path.basename(filePath)}`, message: 'Preview not available for this file type.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};