const { auth: firebaseAuth, db: firestoreDb } = require('../src/firebaseAdmin');

/**
 * Verify a Firebase ID Token and load the user profile from Firestore.
 * Returns a normalized user object or throws on invalid/expired tokens.
 */
async function verifyFirebaseToken(token) {
  const decodedToken = await firebaseAuth.verifyIdToken(token);
  const uid = decodedToken.uid;

  const doc = await firestoreDb.collection('users').doc(uid).get();
  const profile = doc.exists ? doc.data() : null;

  // If no Firestore profile exists yet, return a basic structure to allow
  // register/login flows to complete before the profile is written.
  if (!profile) {
    return {
      sub: uid,
      uid,
      email: decodedToken.email,
      name: decodedToken.name || '',
      role: 'user',
      approvalStatus: 'pending',
      isApproved: false,
    };
  }

  const approvalStatus =
    profile.approvalStatus ||
    profile.status ||
    (profile.isApproved ? 'approved' : 'pending');

  return {
    sub: uid,
    uid,
    email: profile.email || decodedToken.email,
    name: profile.name || decodedToken.name || '',
    username: profile.email || decodedToken.email,
    role: profile.role || 'user',
    approvalStatus,
    isApproved: approvalStatus === 'approved',
  };
}

/**
 * Express middleware – requires a valid Firebase ID Token in the
 * Authorization header.  Blocks pending/rejected users with 403.
 */
async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    const user = await verifyFirebaseToken(token);

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

/**
 * Express middleware – same as authenticateToken but allows unauthenticated
 * requests through (req.user will be null).
 */
async function optionalAuthenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  if (!authorization) return next();

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  try {
    const user = await verifyFirebaseToken(token);
    req.user = user;
    return next();
  } catch (error) {
    return next();
  }
}

/**
 * Requires a valid Firebase token but does NOT block on approval/payment status.
 * Used by the payment flow so a signed-in but not-yet-paid user can pay.
 */
async function authenticateSignedIn(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }
  try {
    req.user = await verifyFirebaseToken(token);
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

module.exports = { authenticateToken, optionalAuthenticateToken, authenticateSignedIn, requireAdmin };
