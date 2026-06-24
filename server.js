require('dotenv').config({ quiet: true });

const cors = require('cors');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');
const History = require('./models/History');
const healthRoutes = require('./routes/healthRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examAttemptRoutes = require('./routes/examAttemptRoutes');
const examSetRoutes = require('./routes/examSetRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { getJwtSecret, optionalAuthenticateToken } = require('./middleware/auth');

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
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  // getJwtSecret enforces the production requirement and emits a safe development warning.
  getJwtSecret();

  const origins = allowedOrigins();
  if (isProduction && origins.length === 0) throw new Error('CORS_ORIGIN is required in production');
  if (isProduction && !process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required in production');
  if (origins.includes('*')) throw new Error('CORS_ORIGIN must not contain a wildcard origin');
}

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  console.warn('SESSION_SECRET is not set; using the development JWT signing key for sessions.');
  return getJwtSecret();
}

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected: krupuchuay');
}

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is temporarily unavailable' });
  }
  return next();
}

function requireSessionAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication is required' });
  return next();
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
  app.use(session({
    name: 'krupuchuay.sid',
    secret: sessionSecret(),
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', ttl: 24 * 60 * 60, autoRemove: 'native' }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.use('/api', requireDb);
  app.use('/api/health', healthRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/exam-attempts', examAttemptRoutes);
  app.use('/api/exam-sets', examSetRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/auth', authRateLimiter, authRoutes);
  app.use('/api/users', userRoutes);

  // These session routes preserve the existing history feature. Login and registration
  // are intentionally served only by /api/auth, which uses bcrypt and JWT.
  app.get('/api/session', optionalAuthenticateToken, (req, res) => {
    if (req.user) return res.json(req.user);
    if (req.session.user) return res.json(req.session.user);
    return res.status(401).json({ error: 'Authentication is required' });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get('/api/history/:username', requireSessionAuth, async (req, res) => {
    try {
      const { username } = req.params;
      if (req.session.user.username !== username && req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      const history = await History.find({ username }).sort({ createdAt: -1 }).limit(100);
      return res.json(history);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to load history' });
    }
  });

  app.post('/api/history/:username', requireSessionAuth, async (req, res) => {
    try {
      const { username } = req.params;
      if (req.session.user.username !== username) return res.status(403).json({ error: 'Access denied' });
      await History.create({ ...req.body, username });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to save history' });
    }
  });

  app.delete('/api/history/:username', requireSessionAuth, async (req, res) => {
    try {
      const { username } = req.params;
      if (req.session.user.username !== username && req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      await History.deleteMany({ username });
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
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));
  } catch (error) {
    const safeMessage = ['MONGODB_URI is required', 'JWT_SECRET is required in production', 'SESSION_SECRET is required in production', 'CORS_ORIGIN is required in production', 'CORS_ORIGIN must not contain a wildcard origin'].includes(error.message)
      ? error.message
      : 'Unable to start server. Check the database connection and deployment configuration.';
    console.error(`Server startup failed: ${safeMessage}`);
    process.exit(1);
  }
}

startServer();
