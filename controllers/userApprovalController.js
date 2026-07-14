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
    id: user.uid,
    uid: user.uid,
    name: user.name,
    email: user.email || null,
    username: user.username || user.email,
    role: user.role,
    approvalStatus: approvalStatusOf(user),
    isApproved: approvalStatusOf(user) === 'approved',
    createdAt: user.createdAt ? (user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt) : null,
    updatedAt: user.updatedAt ? (user.updatedAt.toDate ? user.updatedAt.toDate() : user.updatedAt) : null,
  };
}

function validApprovalStatus(value) {
  return ['approved', 'pending', 'rejected'].includes(value);
}

// Enrich a list of Firestore user profiles with emailVerified from Firebase Auth
// (batched — firebaseAuth.getUsers accepts up to 100 identifiers per call).
async function withEmailVerified(profiles) {
  const uids = profiles.map(p => p.uid).filter(Boolean);
  const verifiedMap = {};
  try {
    for (let i = 0; i < uids.length; i += 100) {
      const chunk = uids.slice(i, i + 100).map(uid => ({ uid }));
      const result = await firebaseAuth.getUsers(chunk);
      result.users.forEach(u => { verifiedMap[u.uid] = u.emailVerified === true; });
    }
  } catch (error) {
    console.warn('withEmailVerified failed:', error.message);
  }
  return profiles.map(p => ({ ...publicUser(p), emailVerified: p.uid in verifiedMap ? verifiedMap[p.uid] : null }));
}

async function getUsers(req, res) {
  try {
    const { limit, startAfter, role, approvalStatus, status } = req.query;
    
    let limitNum = Number.parseInt(limit, 10);
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 50;
    limitNum = Math.min(Math.max(limitNum, 1), 100);

    let startAfterDoc = null;
    if (startAfter && typeof startAfter === 'string' && startAfter.trim()) {
      const doc = await firestoreDb.collection('users').doc(startAfter).get();
      if (doc.exists) {
        startAfterDoc = doc;
      }
    }

    let query = firestoreDb.collection('users');
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    const statusVal = approvalStatus || status;
    if (statusVal) {
      query = query.where('approvalStatus', '==', statusVal);
    }

    query = query.orderBy('createdAt', 'desc');

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    // limitNum + 1 to check if there is a next page
    query = query.limit(limitNum + 1);

    const snapshot = await query.get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    const hasNextPage = users.length > limitNum;
    const paginatedUsers = hasNextPage ? users.slice(0, limitNum) : users;
    const nextCursor = hasNextPage && paginatedUsers.length > 0 ? paginatedUsers[paginatedUsers.length - 1].id : null;

    return res.json({
      users: await withEmailVerified(paginatedUsers),
      nextCursor,
      hasNextPage,
      pageSize: limitNum
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Unable to load users' });
  }
}

async function getPendingUsers(req, res) {
  try {
    const snapshot = await firestoreDb.collection('users')
      .where('approvalStatus', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return res.json(await withEmailVerified(users));
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
