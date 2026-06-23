const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicUser(user) {
  const approvalStatus = user.approvalStatus || user.status || (user.isApproved ? 'approved' : 'pending');
  return {
    id: user._id,
    username: user.username,
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
  const { name, email, password } = req.body;
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
  const { email, password } = req.body;
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
      // A legacy account gets upgraded to a bcrypt hash after its first email login.
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

module.exports = { register, login };
