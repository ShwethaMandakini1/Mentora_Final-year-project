const User          = require('../models/User');
const generateToken = require('../utils/generatetoken');
const nodemailer    = require('nodemailer');

// ── REGISTER ─────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success:false, message:'All fields are required' });
    }
    const exists = await User.findOne({ $or:[{email},{username}] });
    if (exists) {
      return res.status(400).json({ success:false, message:'Username or email already exists' });
    }
    const user  = await User.create({ username, email, password, role: role||'student' });
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      success: true,
      token,
      user: { _id:user._id, username:user.username, email:user.email, role:user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success:false, message:'Username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success:false, message:'Invalid credentials' });
    if (role && user.role !== role) {
      return res.status(401).json({ success:false, message:`No ${role} account found with this username` });
    }
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success:false, message:'Invalid credentials' });
    const token = generateToken(user._id, user.role);
    res.json({
      success: true,
      token,
      user: { _id:user._id, username:user.username, email:user.email, role:user.role },
    });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── GET ME ────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success:true, user });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── FORGOT PASSWORD ───────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success:false, message:'No account with that email' });

    const otp    = Math.floor(10000 + Math.random() * 90000).toString();
    user.resetPasswordOTP    = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave:false });

    // Send email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,  // your gmail address in .env
          pass: process.env.EMAIL_PASS,  // your 16-char App Password in .env (NOT your gmail password)
        },
      });

      await transporter.sendMail({
        from:    `"Mentora" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: 'Mentora - Password Reset OTP',
        html:    `
          <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
            <h2 style="color:#4f46e5;">Mentora Password Reset</h2>
            <p>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f3f4f6;border-radius:6px;margin:16px 0;">
              ${otp}
            </div>
            <p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      res.json({ success:true, message:'OTP sent to your email' });

    } catch (mailErr) {
      // ── FIXED: no longer leaking OTP in response ──
      console.error('Email error:', mailErr.message);
      return res.status(500).json({ success:false, message:'Failed to send email. Please try again later.' });
    }

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── VERIFY OTP ────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP:    otp,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success:false, message:'Invalid or expired OTP' });
    res.json({ success:true, message:'OTP verified' });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── RESET PASSWORD ────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP:    otp,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success:false, message:'Invalid or expired OTP' });
    user.password            = newPassword;
    user.resetPasswordOTP    = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ success:true, message:'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};