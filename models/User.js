const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Legacy fields remain for the existing session-based frontend routes.
  username: { type: String, required: true, unique: true, trim: true },
  // Retained only to migrate legacy records after a successful login. New passwords
  // are always written to passwordHash and this field is never returned by queries.
  password: { type: String, select: false },
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // status is retained for users created by the original frontend.
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
  approvalStatus: { type: String, enum: ['approved', 'pending', 'rejected'] },
  isApproved: { type: Boolean },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
