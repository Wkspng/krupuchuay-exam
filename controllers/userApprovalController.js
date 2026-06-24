const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth: firebaseAuth, db: firestoreDb } = require('../src/firebaseAdmin');

function isValidId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function approvalStatusOf(user) {
  return user.approvalStatus || user.status || (user.isApproved ? 'approved' : 'pending');
}

function publicUser(user) {
  return {
    id: user.uid || (user._id ? user._id.toString() : ''),
    uid: user.uid || (user._id ? user._id.toString() : ''),
    name: user.name,
    email: user.email || null,
    username: user.username || user.email,
    role: user.role,
    approvalStatus: approvalStatusOf(user),
    isApproved: approvalStatusOf(user) === 'approved',
    createdAt: user.createdAt ? (user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt) : null,
    updatedAt: user.updatedAt ? (user.updatedAt.toDate ? user.updatedAt.toDate() : user.updatedAt) : null,
    isLegacy: !user.email,
  };
}

function validApprovalStatus(value) {
  return ['approved', 'pending', 'rejected'].includes(value);
}

async function getUsers(req, res) {
  try {
    const snapshot = await firestoreDb.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json(users.map(publicUser));
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Unable to load users' });
  }
}

async function getPendingUsers(req, res) {
  try {
    const snapshot = await firestoreDb.collection('users').where('approvalStatus', '==', 'pending').get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json(users.map(publicUser));
  } catch (error) {
    console.error('getPendingUsers error:', error);
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
    const userSnapshot = await firestoreDb.collection('users').where('email', '==', normalizedEmail).limit(1).get();
    if (!userSnapshot.empty) {
      return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
    }

    const firebaseUser = await firebaseAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: name.trim()
    });
    const uid = firebaseUser.uid;

    if (role === 'admin') {
      await firebaseAuth.setCustomUserClaims(uid, { admin: true });
    }

    const userProfile = {
      uid,
      email: normalizedEmail,
      name: name.trim(),
      role,
      approvalStatus,
      isApproved: approvalStatus === 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await firestoreDb.collection('users').doc(uid).set(userProfile);

    try {
      await User.create({
        username: normalizedEmail,
        name: name.trim(),
        email: normalizedEmail,
        role,
        status: approvalStatus,
        approvalStatus,
        isApproved: approvalStatus === 'approved',
        approvedAt: approvalStatus === 'approved' ? new Date() : undefined,
      });
    } catch (mongoErr) {
      console.warn('MongoDB sync failed during createUser:', mongoErr.message);
    }

    return res.status(201).json(publicUser(userProfile));
  } catch (error) {
    console.error('createUser error:', error);
    if (error.code === 'auth/email-already-in-use') {
      return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
    }
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
    const userRef = firestoreDb.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const currentData = doc.data();

    if (req.params.id === req.user.sub && (role !== undefined || approvalStatus !== undefined)) {
      return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role หรือสถานะของบัญชีตัวเองได้' });
    }

    if (role === 'user' && currentData.role === 'admin') {
      const adminsSnapshot = await firestoreDb.collection('users').where('role', '==', 'admin').get();
      if (adminsSnapshot.size <= 1) {
        return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role ของผู้ดูแลคนสุดท้ายได้' });
      }
    }

    const firebaseUpdate = {};
    if (email !== undefined) firebaseUpdate.email = email.trim().toLowerCase();
    if (password !== undefined) firebaseUpdate.password = password;
    if (name !== undefined) firebaseUpdate.displayName = name.trim();
    if (Object.keys(firebaseUpdate).length > 0) {
      await firebaseAuth.updateUser(req.params.id, firebaseUpdate);
    }

    if (role !== undefined && role !== currentData.role) {
      if (role === 'admin') {
        await firebaseAuth.setCustomUserClaims(req.params.id, { admin: true });
      } else {
        await firebaseAuth.setCustomUserClaims(req.params.id, { admin: false });
      }
    }

    const firestoreUpdate = { updatedAt: new Date() };
    if (name !== undefined) firestoreUpdate.name = name.trim();
    if (email !== undefined) firestoreUpdate.email = email.trim().toLowerCase();
    if (role !== undefined) firestoreUpdate.role = role;
    if (approvalStatus !== undefined) {
      firestoreUpdate.approvalStatus = approvalStatus;
      firestoreUpdate.isApproved = approvalStatus === 'approved';
      if (approvalStatus === 'approved') {
        firestoreUpdate.approvedAt = new Date();
        firestoreUpdate.approvedBy = req.user.sub;
      }
    }
    await userRef.update(firestoreUpdate);

    try {
      const mongoUser = await User.findOne({ $or: [{ email: currentData.email }, { username: currentData.email }] });
      if (mongoUser) {
        if (name !== undefined) mongoUser.name = name.trim();
        if (email !== undefined) {
          mongoUser.email = email.trim().toLowerCase();
          mongoUser.username = email.trim().toLowerCase();
        }
        if (role !== undefined) mongoUser.role = role;
        if (approvalStatus !== undefined) {
          mongoUser.status = approvalStatus;
          mongoUser.approvalStatus = approvalStatus;
          mongoUser.isApproved = approvalStatus === 'approved';
          if (approvalStatus === 'approved') {
            mongoUser.approvedAt = new Date();
            if (mongoose.isValidObjectId(req.user.sub)) {
              mongoUser.approvedBy = req.user.sub;
            }
          }
        }
        await mongoUser.save();
      }
    } catch (mongoErr) {
      console.warn('MongoDB sync failed during updateUser:', mongoErr.message);
    }

    const updatedDoc = await userRef.get();
    return res.json(publicUser({ uid: req.params.id, ...updatedDoc.data() }));
  } catch (error) {
    console.error('updateUser error:', error);
    if (error.code === 'auth/email-already-in-use') {
      return res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
    }
    return res.status(500).json({ error: 'Unable to update user' });
  }
}

async function updateApproval(req, res, approvalStatus) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });

  try {
    const userRef = firestoreDb.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const currentData = doc.data();

    if (currentData.role === 'admin') {
      return res.status(400).json({ error: 'ไม่สามารถเปลี่ยนสถานะบัญชีผู้ดูแลระบบผ่าน endpoint นี้ได้' });
    }

    const updateData = {
      approvalStatus,
      isApproved: approvalStatus === 'approved',
      updatedAt: new Date(),
    };
    if (approvalStatus === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = req.user.sub;
    }
    await userRef.update(updateData);

    try {
      const mongoUser = await User.findOne({ $or: [{ email: currentData.email }, { username: currentData.email }] });
      if (mongoUser) {
        mongoUser.status = approvalStatus;
        mongoUser.approvalStatus = approvalStatus;
        mongoUser.isApproved = approvalStatus === 'approved';
        if (approvalStatus === 'approved') {
          mongoUser.approvedAt = new Date();
          if (mongoose.isValidObjectId(req.user.sub)) {
            mongoUser.approvedBy = req.user.sub;
          }
        }
        await mongoUser.save();
      }
    } catch (mongoErr) {
      console.warn('MongoDB sync failed during updateApproval:', mongoErr.message);
    }

    const updatedDoc = await userRef.get();
    return res.json(publicUser({ uid: req.params.id, ...updatedDoc.data() }));
  } catch (error) {
    console.error('updateApproval error:', error);
    return res.status(500).json({ error: 'Unable to update user approval' });
  }
}

async function deleteUser(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
  if (req.params.id === req.user.sub) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้ดูแลของตัวเองได้' });

  try {
    const userRef = firestoreDb.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const currentData = doc.data();

    if (currentData.role === 'admin') {
      const adminsSnapshot = await firestoreDb.collection('users').where('role', '==', 'admin').get();
      if (adminsSnapshot.size <= 1) {
        return res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้ดูแลคนสุดท้ายได้' });
      }
    }

    await firebaseAuth.deleteUser(req.params.id);
    await userRef.delete();

    try {
      await User.deleteOne({ $or: [{ email: currentData.email }, { username: currentData.email }] });
    } catch (mongoErr) {
      console.warn('MongoDB sync failed during deleteUser:', mongoErr.message);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('deleteUser error:', error);
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
