const rateLimit = require('express-rate-limit');

/**
 * NOTE on Cloud Run Multi-instance limits:
 * express-rate-limit uses memory-store by default, meaning rate limit state is 
 * kept per container instance and not globally distributed. This provides basic
 * container-level protection.
 * For a distributed, precise rate limit, we would use a Redis or Firestore-backed 
 * store in the next phase.
 */

// Helper to construct custom JSON error response for 429 Rate Limit
const customHandler = (req, res, next, options) => {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  res.status(429).json({
    error: 'RATE_LIMITED',
    message: 'มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
    retryAfter: retryAfterSeconds
  });
};

const keyGen = (req) => {
  return req.user ? req.user.uid : req.ip;
};

// Global API rate limiter: 600 requests / 15 minutes / IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.method === 'OPTIONS',
  handler: customHandler
});

// Authenticated API rate limiter: 300 requests / 15 minutes / userId (or IP)
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  skip: (req) => req.method === 'OPTIONS',
  handler: customHandler
});

// Submit attempt: 10 submissions / 10 minutes / userId (or IP)
const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  skip: (req) => req.method === 'OPTIONS',
  handler: customHandler
});

// Admin mutations rate limiter: 60 requests / 15 minutes / userId (or IP)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  skip: (req) => req.method === 'OPTIONS',
  handler: customHandler
});

module.exports = {
  globalLimiter,
  userLimiter,
  submissionLimiter,
  adminLimiter
};
