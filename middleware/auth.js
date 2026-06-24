const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { auth: firebaseAuth, db: firestoreDb } = require('../src/firebaseAdmin');

// A temporary key keeps local development usable without changing .env. Set JWT_SECRET in
// production so tokens remain valid after a server restart.
const developmentJwtSecret = crypto.randomBytes(48).toString('hex');
let hasWarnedAboutDevelopmentSecret = false;

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  if (!hasWarnedAboutDevelopmentSecret) {
    console.warn('JWT_SECRET is not set; a temporary development signing key is being used.');
    hasWarnedAboutDevelopmentSecret = true;
  }
  return developmentJwtSecret;
}

async function verifyFirebaseOrJwt(token) {
  // First attempt: Verify via Firebase Admin SDK
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    // Find user profile in Firestore
    const doc = await firestoreDb.collection('users').doc(decodedToken.uid).get();
    const profile = doc.exists ? doc.data() : null;
    
    // If no Firestore profile exists yet, return a basic structure to allow register/login flows to complete
    if (!profile) {
      return {
        sub: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
        role: 'user',
        approvalStatus: 'pending',
        isApproved: false
      };
    }
    
    const approvalStatus = profile.approvalStatus || profile.status || (profile.isApproved ? 'approved' : 'pending');
    return {
      sub: decodedToken.uid,
      uid: decodedToken.uid,
      email: profile.email || decodedToken.email,
      name: profile.name || decodedToken.name || '',
      role: profile.role || 'user',
      approvalStatus,
      isApproved: approvalStatus === 'approved'
    };
  } catch (firebaseErr) {
    // Second attempt: Fallback to local JWT
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      return decoded;
    } catch (jwtErr) {
      if (jwtErr.message === 'JWT_SECRET is required in production') {
        throw new Error('JWT_SECRET is required in production');
      }
      throw new Error('Invalid or expired authentication token');
    }
  }
}

async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    const user = await verifyFirebaseOrJwt(token);
    
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติจากแอดมิน กรุณารอการอนุมัติ' });
    }
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อแอดมิน' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.message === 'JWT_SECRET is required in production') {
      return res.status(500).json({ error: 'JWT authentication is not configured' });
    }
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

async function optionalAuthenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  if (!authorization) return next();

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    const user = await verifyFirebaseOrJwt(token);
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติจากแอดมิน กรุณารอการอนุมัติ' });
    }
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อแอดมิน' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required' });
  }
  return next();
}

module.exports = { authenticateToken, optionalAuthenticateToken, requireAdmin, getJwtSecret };

