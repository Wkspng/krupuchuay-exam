const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function approvalStatusOf(user) {
  return user.approvalStatus || user.status || (user.isApproved ? 'approved' : 'pending');
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email || null,
    username: user.username,
    role: user.role,
    approvalStatus: approvalStatusOf(user),
    isApproved: approvalStatusOf(user) === 'approved',
    createdAt: user.createdAt || user.registeredAt,
    updatedAt: user.updatedAt,
    isLegacy: !user.email,
  };
}

function pendingFilter() {
  return {
    $or: [
      { approvalStatus: 'pending' },
      { approvalStatus: { $exists: false }, status: 'pending' },
    ],
  };
}

function validApprovalStatus(value) {
  return ['approved', 'pending', 'rejected'].includes(value);
}

async function getUsers(req, res) {
  try {
    const users = await User.find(
      {},
      'username name email role status approvalStatus isApproved createdAt updatedAt registeredAt',
    ).sort({ createdAt: -1, registeredAt: -1 });
    return res.json(users.map(publicUser));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load users' });
  }
}

async function getPendingUsers(req, res) {
  try {
    const users = await User.find(
      pendingFilter(),
      'username name email role status approvalStatus isApproved createdAt updatedAt registeredAt',
    ).sort({ createdAt: -1, registeredAt: -1 });
    return res.json(users.map(publicUser));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load pending users' });
  }
}

async function createUser(req, res) {
  const { name, email, password, role = 'user', approvalStatus = 'pending' } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อ-นามสกุล' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'กรุณาระบุอีเมลที่ถูกต้อง' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'role ต้องเป็น user หรือ admin' });
  if (!validApprovalStatus(approvalStatus)) return res.status(400).json({ error: 'สถานะอนุมัติไม่ถูกต้อง' });

  const normalizedEmail = email.trim().toLowerCase();
  try {
    const existingUser = await User.exists({ $or: [{ email: normalizedEmail }, { username: normalizedEmail }] });
    if (existingUser) return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });

    const isApproved = approvalStatus === 'approved';
    const user = await User.create({
      username: normalizedEmail,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      status: approvalStatus,
      approvalStatus,
      isApproved,
      approvedAt: isApproved ? new Date() : undefined,
      approvedBy: isApproved ? req.user.sub : undefined,
    });
    return res.status(201).json(publicUser(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
    return res.status(500).json({ error: 'Unable to create user' });
  }
}

async function updateUser(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
  const { name, email, password, role, approvalStatus } = req.body;
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ error: 'กรุณาระบุชื่อ-นามสกุล' });
  if (email !== undefined && !isValidEmail(email)) return res.status(400).json({ error: 'กรุณาระบุอีเมลที่ถูกต้อง' });
  if (password !== undefined && (typeof password !== 'string' || password.length < 6)) return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  if (role !== undefined && !['user', 'admin'].includes(role)) return res.status(400).json({ error: 'role ต้องเป็น user หรือ admin' });
  if (approvalStatus !== undefined && !validApprovalStatus(approvalStatus)) return res.status(400).json({ error: 'สถานะอนุมัติไม่ถูกต้อง' });

  try {
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.toString() === req.user.sub && (role !== undefined || approvalStatus !== undefined)) {
      return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role หรือสถานะของบัญชีตัวเองได้' });
    }
    if (user.role === 'admin' && role === 'user' && await User.countDocuments({ role: 'admin' }) <= 1) {
      return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role ของผู้ดูแลคนสุดท้ายได้' });
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      const duplicate = await User.exists({
        _id: { $ne: user._id },
        $or: [{ email: normalizedEmail }, { username: normalizedEmail }],
      });
      if (duplicate) return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
      user.email = normalizedEmail;
    }
    if (name !== undefined) user.name = name.trim();
    if (password !== undefined) user.passwordHash = await bcrypt.hash(password, 12);
    if (role !== undefined) user.role = role;
    if (approvalStatus !== undefined) {
      user.status = approvalStatus;
      user.approvalStatus = approvalStatus;
      user.isApproved = approvalStatus === 'approved';
      if (approvalStatus === 'approved') {
        user.approvedAt = new Date();
        user.approvedBy = req.user.sub;
      }
    }
    await user.save();
    return res.json(publicUser(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
    return res.status(500).json({ error: 'Unable to update user' });
  }
}

async function updateApproval(req, res, approvalStatus) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'ไม่สามารถเปลี่ยนสถานะบัญชีผู้ดูแลระบบผ่าน endpoint นี้ได้' });

    user.approvalStatus = approvalStatus;
    user.isApproved = approvalStatus === 'approved';
    // Keep the original field synchronized for the existing session-based routes.
    user.status = approvalStatus;
    if (approvalStatus === 'approved') {
      user.approvedAt = new Date();
      user.approvedBy = req.user.sub;
    }
    await user.save();
    return res.json(publicUser(user));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to update user approval' });
  }
}

async function deleteUser(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
  if (req.params.id === req.user.sub) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้ดูแลของตัวเองได้' });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) {
      return res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้ดูแลคนสุดท้ายได้' });
    }
    await User.deleteOne({ _id: user._id });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete user' });
  }
}

function approveUser(req, res) {
  return updateApproval(req, res, 'approved');
}

function rejectUser(req, res) {
  return updateApproval(req, res, 'rejected');
}

module.exports = {
  getUsers,
  getPendingUsers,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
};
