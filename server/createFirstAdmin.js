/**
 * Run this ONCE to create your first admin account.
 * Usage:  node createFirstAdmin.js
 * Place this file in: mentora/server/
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Inline schema so we don't need the full app
const adminSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  name:         { type: String, required: true },
  isSuperAdmin: { type: Boolean, default: true },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Change these values ──────────────────────────────────────────────────
  const USERNAME = 'afmin';
  const EMAIL    = 'afmin@mentora.com';
  const PASSWORD = 'Admin@1234';        // change after first login!
  const NAME     = 'Admin User';
  // ─────────────────────────────────────────────────────────────────────────

  const existing = await Admin.findOne({ username: USERNAME });
  if (existing) {
    console.log('⚠️  Admin already exists. Exiting.');
    process.exit(0);
  }

  const hashed = await bcrypt.hash(PASSWORD, 12);
  await Admin.create({ username: USERNAME, email: EMAIL, password: hashed, name: NAME, isSuperAdmin: true });

  console.log('🎉 Super admin created!');
  console.log(`   Username : ${USERNAME}`);
  console.log(`   Password : ${PASSWORD}`);
  console.log('   Login at : http://localhost:5173/admin');
  console.log('   ⚠️  Delete this file after use!');
  process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });