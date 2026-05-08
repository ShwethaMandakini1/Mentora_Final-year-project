const Assignment             = require('../models/Assignment');
const Submission             = require('../models/Submission');
const User                   = require('../models/User');
const { createNotification } = require('./notificationService');
const { sendDeadlineReminder } = require('./emailService');

// ── Track which reminders have been sent (in-memory, resets on server restart) 
// For production, store this in DB. For now this works perfectly.
const sentReminders = new Set();

const getReminderKey = (userId, assignmentId, daysLeft) =>
  `${userId}_${assignmentId}_${daysLeft}d`;

// ── Check all assignments and send reminders ──────────────────────────────────
const checkDeadlines = async () => {
  console.log('⏰ Checking deadlines...');
  try {
    const now        = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all assignments with upcoming deadlines
    const assignments = await Assignment.find({
      deadline: { $gte: now, $lte: inSevenDays },
    });

    if (assignments.length === 0) {
      console.log('⏰ No upcoming deadlines found.');
      return;
    }

    console.log(`⏰ Found ${assignments.length} assignments with upcoming deadlines`);

    // Get all students
    const students = await User.find({ role: 'student' }).select('_id username email');

    for (const assignment of assignments) {
      const deadline = new Date(assignment.deadline);
      const msLeft   = deadline.getTime() - now.getTime();
      const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));

      // Only remind at: 7, 3, 1 days and on the day (0)
      const reminderDays = [7, 3, 1, 0];
      if (!reminderDays.includes(daysLeft)) continue;

      for (const student of students) {
        const key = getReminderKey(student._id, assignment._id, daysLeft);
        if (sentReminders.has(key)) continue; // already sent

        // Check if student already submitted
        const alreadySubmitted = await Submission.findOne({
          student:        student._id,
          assignmentName: assignment.title,
          status:         { $ne: 'Rejected' },
        });

        if (alreadySubmitted) continue; // skip if already submitted

        // Mark as sent BEFORE sending to prevent duplicates
        sentReminders.add(key);

        try {
          // Send in-app notification
          await createNotification({
            userId:  student._id,
            type:    'deadline_reminder',
            title:   `⏰ ${daysLeft === 0 ? 'Due Today!' : daysLeft === 1 ? 'Due Tomorrow!' : `Due in ${daysLeft} days`}`,
            message: `"${assignment.title}" in ${assignment.moduleCode} is due ${
              daysLeft === 0 ? 'today'
            : daysLeft === 1 ? 'tomorrow'
            : `in ${daysLeft} days`} (${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}).`,
            meta: {
              assignmentId:   assignment._id,
              assignmentName: assignment.title,
              moduleCode:     assignment.moduleCode,
              deadline:       assignment.deadline,
              daysLeft,
            },
          });

          // Send email reminder
          await sendDeadlineReminder({
            to:             student.email,
            username:       student.username,
            assignmentName: assignment.title,
            moduleCode:     assignment.moduleCode,
            moduleName:     assignment.moduleName,
            deadline:       assignment.deadline,
            daysLeft,
          });

          console.log(`✅ Reminder sent to ${student.username} for "${assignment.title}" (${daysLeft} days left)`);
        } catch (err) {
          console.error(`❌ Failed to send reminder to ${student.username}:`, err.message);
          sentReminders.delete(key); // retry next time if failed
        }
      }
    }
  } catch (err) {
    console.error('❌ Deadline check error:', err.message);
  }
};

// ── Start the scheduler ───────────────────────────────────────────────────────
// Runs every 6 hours
const startDeadlineReminders = () => {
  console.log('⏰ Deadline reminder service started');

  // Run immediately on startup
  checkDeadlines();

  // Then run every 6 hours
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(checkDeadlines, SIX_HOURS);
};

module.exports = { startDeadlineReminders, checkDeadlines };