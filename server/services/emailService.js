const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Verify connection ─────────────────────────────────────────────────────────
transporter.verify((err) => {
  if (err) console.error('❌ Email service error:', err.message);
  else     console.log('✅ Email service ready');
});

// ── Base HTML template ────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f6fa; color: #374151; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 40px; text-align: center; }
    .header img { width: 48px; height: 48px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
    .body { padding: 32px 40px; }
    .greeting { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .card { background: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .card.warning { border-left-color: #f59e0b; background: #fffbeb; }
    .card.danger  { border-left-color: #dc2626; background: #fef2f2; }
    .card.success { border-left-color: #16a34a; background: #f0fdf4; }
    .card-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .card-value { font-size: 18px; font-weight: 800; color: #111827; }
    .card-sub   { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-weight: 500; }
    .detail-value { color: #111827; font-weight: 600; }
    .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-danger  { background: #fef2f2; color: #dc2626; }
    .badge-success { background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📚 Mentora</h1>
      <p>From Submission to Insight</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from Mentora.<br/>Please do not reply to this email.</p>
      <p style="margin-top:8px;">© 2026 Mentora. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ── SEND deadline reminder ────────────────────────────────────────────────────
exports.sendDeadlineReminder = async ({ to, username, assignmentName, moduleCode, moduleName, deadline, daysLeft }) => {
  const urgency  = daysLeft <= 1 ? 'danger' : daysLeft <= 3 ? 'warning' : 'normal';
  const urgencyLabel = daysLeft === 0 ? '🚨 DUE TODAY!'
                     : daysLeft === 1 ? '⚠️ Due Tomorrow!'
                     : `📅 Due in ${daysLeft} days`;

  const content = `
    <p class="greeting">Hi ${username}! 👋</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin-bottom:20px;">
      This is a friendly reminder that you have an assignment deadline approaching on Mentora.
    </p>

    <div class="card ${urgency === 'danger' ? 'danger' : urgency === 'warning' ? 'warning' : ''}">
      <div class="card-title">⏰ Deadline Alert</div>
      <div class="card-value">${urgencyLabel}</div>
      <div class="card-sub">${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <div style="margin: 20px 0;">
      <div class="detail-row">
        <span class="detail-label">Assignment</span>
        <span class="detail-value">${assignmentName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Module Code</span>
        <span class="detail-value">${moduleCode}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Module Name</span>
        <span class="detail-value">${moduleName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Deadline</span>
        <span class="detail-value" style="color:${urgency === 'danger' ? '#dc2626' : urgency === 'warning' ? '#d97706' : '#111827'}">
          ${new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>

    ${daysLeft <= 1 ? `
    <div style="background:#fef2f2;border-radius:10px;padding:16px 20px;margin:16px 0;">
      <p style="font-size:13px;color:#dc2626;font-weight:600;">🚨 Action Required!</p>
      <p style="font-size:13px;color:#6b7280;margin-top:6px;">
        ${daysLeft === 0 ? 'This assignment is due TODAY. Please submit as soon as possible!'
                        : 'This assignment is due tomorrow. Make sure your submission is ready!'}
      </p>
    </div>` : `
    <div style="background:#eff6ff;border-radius:10px;padding:16px 20px;margin:16px 0;">
      <p style="font-size:13px;color:#1d4ed8;font-weight:600;">💡 Tip</p>
      <p style="font-size:13px;color:#6b7280;margin-top:6px;">
        Don't wait until the last minute! Log in to Mentora to submit your assignment early.
      </p>
    </div>`}

    <a href="http://localhost:5173/student/submissions" class="btn">
      Go to Submissions →
    </a>
  `;

  await transporter.sendMail({
    from:    `"Mentora 📚" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⏰ ${urgencyLabel} — ${assignmentName} | Mentora`,
    html:    baseTemplate(content),
  });

  console.log(`📧 Deadline reminder sent to ${to} for "${assignmentName}" (${daysLeft} days left)`);
};

// ── SEND submission approved ──────────────────────────────────────────────────
exports.sendApprovalEmail = async ({ to, username, assignmentName, approved, feedback }) => {
  const content = `
    <p class="greeting">Hi ${username}! 👋</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin-bottom:20px;">
      Your pre-approval submission for <strong>${assignmentName}</strong> has been reviewed by your lecturer.
    </p>

    <div class="card ${approved ? 'success' : 'danger'}">
      <div class="card-title">Review Decision</div>
      <div class="card-value">${approved ? '✅ Approved!' : '❌ Needs Revision'}</div>
      <div class="card-sub">
        ${approved
          ? 'Your assignment has been officially submitted to Mentora.'
          : 'Please review the feedback and resubmit.'}
      </div>
    </div>

    ${feedback ? `
    <div style="margin:20px 0;">
      <div class="card-title" style="font-size:13px;font-weight:700;color:#6b7280;margin-bottom:8px;">
        LECTURER FEEDBACK
      </div>
      <p style="font-size:14px;color:#374151;line-height:1.7;background:#f9fafb;padding:16px;border-radius:10px;">
        "${feedback}"
      </p>
    </div>` : ''}

    <a href="http://localhost:5173/student/submissions" class="btn">
      View Submissions →
    </a>
  `;

  await transporter.sendMail({
    from:    `"Mentora 📚" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${approved ? '✅ Assignment Approved' : '❌ Assignment Needs Revision'} — ${assignmentName} | Mentora`,
    html:    baseTemplate(content),
  });
};

// ── SEND marks released ───────────────────────────────────────────────────────
exports.sendMarksEmail = async ({ to, username, assignmentName, moduleCode, score, grade, feedback }) => {
  const content = `
    <p class="greeting">Hi ${username}! 👋</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin-bottom:20px;">
      Great news! Your marks for <strong>${assignmentName}</strong> have been released.
    </p>

    <div style="display:flex;gap:16px;margin:20px 0;">
      <div class="card success" style="flex:1;text-align:center;">
        <div class="card-title">Score</div>
        <div class="card-value" style="font-size:32px;color:#16a34a;">${score}%</div>
      </div>
      <div class="card" style="flex:1;text-align:center;">
        <div class="card-title">Grade</div>
        <div class="card-value" style="font-size:32px;color:#2563eb;">${grade || '—'}</div>
      </div>
    </div>

    <div class="detail-row">
      <span class="detail-label">Assignment</span>
      <span class="detail-value">${assignmentName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Module</span>
      <span class="detail-value">${moduleCode}</span>
    </div>

    ${feedback ? `
    <div style="margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:#6b7280;margin-bottom:8px;">LECTURER FEEDBACK</div>
      <p style="font-size:14px;color:#374151;background:#f9fafb;padding:16px;border-radius:10px;line-height:1.7;">
        "${feedback}"
      </p>
    </div>` : ''}

    <a href="http://localhost:5173/student/reports" class="btn">
      View Full Report →
    </a>
  `;

  await transporter.sendMail({
    from:    `"Mentora 📚" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎯 Marks Released — ${assignmentName} | Mentora`,
    html:    baseTemplate(content),
  });
};