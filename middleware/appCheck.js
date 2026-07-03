const { app } = require('../src/firebaseAdmin');
const { getAppCheck } = require('firebase-admin/app-check');

// Initialize App Check
let appCheck;
try {
  appCheck = getAppCheck(app);
} catch (err) {
  console.error('Failed to initialize App Check:', err);
}

async function verifyAppCheck(req, res, next) {
  const token = req.header('X-Firebase-AppCheck');
  const enforce = process.env.APP_CHECK_ENFORCE === 'true' || process.env.APP_CHECK_MODE === 'enforce';

  if (!appCheck) {
    req.appCheckStatus = 'disabled';
    return next();
  }

  if (!token) {
    req.appCheckStatus = 'missing';
    if (enforce) {
      return res.status(401).json({ error: 'App Check token is missing' });
    }
    return next();
  }

  try {
    await appCheck.verifyToken(token);
    req.appCheckStatus = 'valid';
    return next();
  } catch (error) {
    req.appCheckStatus = 'invalid';
    console.warn(`[APP-CHECK-WARNING] Invalid App Check token: ${error.message}`);
    if (enforce) {
      return res.status(401).json({ error: 'Invalid App Check token' });
    }
    return next();
  }
}

module.exports = { verifyAppCheck };
