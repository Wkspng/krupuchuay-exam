function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const rateLimited = res.statusCode === 429;
    const userId = req.user ? req.user.uid : null;
    const appCheckStatus = req.appCheckStatus || 'disabled';

    console.log(JSON.stringify({
      logType: 'API_USAGE',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: duration,
      userId: userId ? `${userId.substring(0, 5)}...` : null, // mask UID for privacy
      rateLimited,
      appCheckStatus
    }));
  });

  next();
}

module.exports = { requestLogger };
