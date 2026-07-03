require('dotenv').config({ quiet: true });

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { db: firestoreDb } = require('./src/firebaseAdmin');
const healthRoutes = require('./routes/healthRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examAttemptRoutes = require('./routes/examAttemptRoutes');
const examSetRoutes = require('./routes/examSetRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { authenticateToken, optionalAuthenticateToken } = require('./middleware/auth');
const { globalLimiter } = require('./middleware/rateLimiter');
const { verifyAppCheck } = require('./middleware/appCheck');
const { requestLogger } = require('./middleware/requestLogger');

const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

function allowedOrigins() {
  const origins = (process.env.CORS_ORIGIN || (isProduction ? '' : `http://localhost:${PORT}`))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins;
}

function validateRuntimeConfiguration() {
  const origins = allowedOrigins();
  if (isProduction && origins.length === 0) throw new Error('CORS_ORIGIN is required in production');
  if (origins.includes('*')) throw new Error('CORS_ORIGIN must not contain a wildcard origin');
}

function createApp() {
  const app = express();
  const origins = allowedOrigins();
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    handler: (req, res) => res.status(429).json({ error: 'Too many authentication requests. Please try again later.' }),
  });

  if (isProduction) app.set('trust proxy', 1);

  // The current frontend intentionally uses inline event handlers. Keep Helmet's
  // remaining security headers enabled and defer CSP to a future handler refactor.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Global middlewares for all API routes
  app.use('/api', globalLimiter);
  app.use('/api', verifyAppCheck);
  app.use('/api', requestLogger);

  app.use('/api/health', healthRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/exam-attempts', examAttemptRoutes);
  app.use('/api/exam-sets', examSetRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/auth', authRateLimiter, authRoutes);
  app.use('/api/users', userRoutes);

  // Stateless session endpoint – verifies the Firebase ID Token from the
  // Authorization header and returns the caller's Firestore user profile.
  app.get('/api/session', optionalAuthenticateToken, (req, res) => {
    if (req.user) return res.json(req.user);
    return res.status(401).json({ error: 'Authentication is required' });
  });

  // Logout is handled entirely on the client via firebase.auth().signOut().
  // This endpoint is kept as a no-op for backwards compatibility so older
  // cached frontend bundles do not encounter a 404.
  app.post('/api/logout', (req, res) => {
    return res.json({ success: true });
  });

  app.get('/api/history/:username', authenticateToken, async (req, res) => {
    try {
      const { username } = req.params;
      if (req.user.username !== username && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      const snapshot = await firestoreDb.collection('history').where('username', '==', username).get();
      const history = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
      return res.json(history);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to load history' });
    }
  });

  app.post('/api/history/:username', authenticateToken, async (req, res) => {
    try {
      const { username } = req.params;
      if (req.user.username !== username) return res.status(403).json({ error: 'Access denied' });
      await firestoreDb.collection('history').add({
        ...req.body,
        username,
        createdAt: new Date()
      });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to save history' });
    }
  });

  app.delete('/api/history/:username', authenticateToken, async (req, res) => {
    try {
      const { username } = req.params;
      if (req.user.username !== username && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      const snapshot = await firestoreDb.collection('history').where('username', '==', username).get();
      const batch = firestoreDb.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to delete history' });
    }
  });

  app.use((error, req, res, next) => {
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' });
    if (error?.message === 'Origin is not allowed by CORS') return res.status(403).json({ error: 'Origin is not allowed' });
    console.error('Unhandled request error');
    return res.status(500).json({ error: 'An unexpected server error occurred' });
  });

  return app;
}

async function startServer() {
  try {
    validateRuntimeConfiguration();
    const app = createApp();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));
  } catch (error) {
    const safeMessage = ['CORS_ORIGIN is required in production', 'CORS_ORIGIN must not contain a wildcard origin'].includes(error.message)
      ? error.message
      : 'Unable to start server. Check the deployment configuration.';
    console.error(`Server startup failed: ${safeMessage}`);
    process.exit(1);
  }
}

startServer();
