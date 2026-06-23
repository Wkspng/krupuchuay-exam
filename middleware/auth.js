const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    if (error.message === 'JWT_SECRET is required in production') {
      return res.status(500).json({ error: 'JWT authentication is not configured' });
    }
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

function optionalAuthenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  if (!authorization) return next();

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
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
