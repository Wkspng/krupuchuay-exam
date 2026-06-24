const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');
const { auth: firebaseAuth, db: firestoreDb } = require('../src/firebaseAdmin');

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFirebaseConfig(req, res) {
  return res.json({
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  });
}

function publicUser(user) {
  const approvalStatus = user.approvalStatus || user.status || (user.isApproved ? 'approved' : 'pending');
  return {
    id: user._id ? user._id.toString() : user.uid,
    uid: user.uid || (user._id ? user._id.toString() : ''),
    username: user.username || user.email,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus,
    isApproved: approvalStatus === 'approved',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function register(req, res) {
  const { name, email, password, idToken } = req.body;

  // ===== FIREBASE REGISTER FLOW =====
  if (idToken) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userEmail = decodedToken.email;

      const userRef = firestoreDb.collection('users').doc(uid);
      const doc = await userRef.get();
      if (doc.exists) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const userProfile = {
        uid,
        email: userEmail,
        name: name.trim(),
        role: 'user',
        approvalStatus: 'pending',
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await userRef.set(userProfile);

      // Sync to MongoDB User
      try {
        await User.create({
          username: userEmail,
          name: name.trim(),
          email: userEmail,
          role: 'user',
          status: 'pending',
          approvalStatus: 'pending',
          isApproved: false,
        });
      } catch (mongoErr) {
        console.warn('MongoDB sync failed during register:', mongoErr.message);
      }

      return res.status(201).json({ user: publicUser(userProfile) });
    } catch (error) {
      console.error('Firebase register error:', error);
      return res.status(500).json({ error: 'Unable to register account' });
    }
  }

  // ===== LEGACY MONGODB REGISTER FLOW =====
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

  const normalizedEmail = email.trim().toLowerCase();
  try {
    const existing = await User.exists({ $or: [{ email: normalizedEmail }, { username: normalizedEmail }] });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: normalizedEmail,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      status: 'pending',
      approvalStatus: 'pending',
      isApproved: false,
    });
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
    return res.status(500).json({ error: 'Unable to register account' });
  }
}

async function login(req, res) {
  const { email, password, idToken } = req.body;

  // ===== FIREBASE LOGIN FLOW =====
  if (idToken) {
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userEmail = decodedToken.email;

      const userRef = firestoreDb.collection('users').doc(uid);
      const doc = await userRef.get();
      let userProfile;

      if (!doc.exists) {
        // Automatically create a pending profile if it's missing in Firestore but exists in Firebase Auth
        userProfile = {
          uid,
          email: userEmail,
          name: decodedToken.name || 'No Name',
          role: 'user',
          approvalStatus: 'pending',
          isApproved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await userRef.set(userProfile);

        // Sync to MongoDB User
        try {
          await User.create({
            username: userEmail,
            name: decodedToken.name || 'No Name',
            email: userEmail,
            role: 'user',
            status: 'pending',
            approvalStatus: 'pending',
            isApproved: false,
          });
        } catch (mongoErr) {
          console.warn('MongoDB sync failed during auto-login registration:', mongoErr.message);
        }
      } else {
        userProfile = doc.data();
      }

      const approvalStatus = userProfile.approvalStatus || userProfile.status || (userProfile.isApproved ? 'approved' : 'pending');

      // Set express session (legacy compatibility)
      req.session.user = {
        username: userProfile.email || userEmail,
        name: userProfile.name,
        role: userProfile.role || 'user',
        approvalStatus,
        isApproved: approvalStatus === 'approved',
      };

      return res.json({ token: idToken, user: publicUser(userProfile) });
    } catch (error) {
      console.error('Firebase login error:', error);
      return res.status(500).json({ error: 'Unable to log in' });
    }
  }

  // ===== LEGACY MONGODB LOGIN FLOW =====
  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash +password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let passwordMatches = false;
    if (user.passwordHash) {
      passwordMatches = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      passwordMatches = password === user.password;
      if (passwordMatches) {
        user.passwordHash = await bcrypt.hash(password, 12);
        user.password = undefined;
        await user.save();
      }
    }
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password' });

    const approvalStatus = user.approvalStatus || user.status || (user.isApproved ? 'approved' : 'pending');
    if (approvalStatus === 'pending') {
      return res.status(403).json({ error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติจากแอดมิน กรุณารอการอนุมัติ' });
    }
    if (approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อแอดมิน' });
    }

    req.session.user = { username: user.username, name: user.name, role: user.role };

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' },
    );
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    if (error.message === 'JWT_SECRET is required in production') {
      return res.status(500).json({ error: 'JWT authentication is not configured' });
    }
    return res.status(500).json({ error: 'Unable to log in' });
  }
}

module.exports = { register, login, getFirebaseConfig };
