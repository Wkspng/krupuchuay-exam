require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const History = require('./models/History');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ไม่พบ MONGODB_URI กรุณาตั้งค่า MONGODB_URI ใน environment variables (.env สำหรับ local หรือ Railway Variables สำหรับ production)');
} else {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');
      await seedAdmin();
    })
    .catch(err => {
      console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
    });
}

async function seedAdmin() {
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    await User.create({
      username: 'admin',
      password: 'admin1234',
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
      status: 'approved',
    });
    console.log('สร้างบัญชี admin เริ่มต้นแล้ว');
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'krupuchuay-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// บล็อกทุก request ที่ต้องใช้ฐานข้อมูลถ้ายังเชื่อมต่อ MongoDB ไม่สำเร็จ
function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'เซิร์ฟเวอร์ยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาตั้งค่า MONGODB_URI ใน environment variables' });
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin')
    return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
  next();
}

app.use('/api', requireDb);

// GET /api/session
app.get('/api/session', (req, res) => {
  if (req.session.user) res.json(req.session.user);
  else res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'กรุณากรอกข้อมูล' });
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    if (user.status === 'pending') return res.status(403).json({ error: '⏳ บัญชีของคุณยังไม่ได้รับการอนุมัติจากแอดมิน กรุณารอการอนุมัติ' });
    if (user.status === 'rejected') return res.status(403).json({ error: '❌ บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อแอดมิน' });
    req.session.user = { username: user.username, name: user.name, role: user.role };
    res.json({ username: user.username, name: user.name, role: user.role });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, name } = req.body;
    if (!username || !password || !confirmPassword || !name) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
    if (password.length < 6) return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username นี้มีอยู่แล้ว' });
    await User.create({ username, password, name, role: 'user', status: 'pending' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /api/history/:username
app.get('/api/history/:username', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    if (req.session.user.username !== username && req.session.user.role !== 'admin')
      return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    const history = await History.find({ username }).sort({ createdAt: -1 }).limit(100);
    res.json(history);
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// POST /api/history/:username
app.post('/api/history/:username', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    if (req.session.user.username !== username)
      return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    await History.create({ ...req.body, username });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// DELETE /api/history/:username (admin หรือเจ้าของบัญชี)
app.delete('/api/history/:username', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    if (req.session.user.username !== username && req.session.user.role !== 'admin')
      return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    await History.deleteMany({ username });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// GET /api/users (admin)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username name role status registeredAt');
    res.json(users);
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// GET /api/users/pending (admin)
app.get('/api/users/pending', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }, 'username name registeredAt');
    res.json(users);
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// POST /api/users (admin)
app.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username นี้มีอยู่แล้ว' });
    await User.create({ username, password, name, role: 'user', status: 'approved' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// POST /api/users/:username/approve (admin)
app.post('/api/users/:username/approve', requireAdmin, async (req, res) => {
  try {
    const result = await User.updateOne({ username: req.params.username }, { status: 'approved' });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// POST /api/users/:username/reject (admin)
app.post('/api/users/:username/reject', requireAdmin, async (req, res) => {
  try {
    const result = await User.updateOne({ username: req.params.username }, { status: 'rejected' });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

// DELETE /api/users/:username (admin)
app.delete('/api/users/:username', requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    if (username === req.session.user.username) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
    const result = await User.deleteOne({ username });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' }); }
});

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
  console.log('กด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์');
});
