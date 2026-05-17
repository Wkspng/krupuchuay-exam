const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([
    { username: 'admin', password: 'admin1234', name: 'ผู้ดูแลระบบ', role: 'admin' },
    { username: 'student01', password: 'thammasat01', name: 'นางสาว สมหญิง ใจดี', role: 'user' },
    { username: 'student02', password: 'thammasat02', name: 'นาย วิชัย มุ่งดี', role: 'user' },
  ], null, 2));
}

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify({}, null, 2));
}

function readUsers() { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
function writeUsers(u) { fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2)); }
function readHistory() { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
function writeHistory(h) { fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2)); }

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'krupuchuay-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin')
    return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
  next();
}

// GET /api/session
app.get('/api/session', (req, res) => {
  if (req.session.user) res.json(req.session.user);
  else res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'กรุณากรอกข้อมูล' });
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  req.session.user = { username: user.username, name: user.name, role: user.role };
  res.json({ username: user.username, name: user.name, role: user.role });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /api/history/:username
app.get('/api/history/:username', requireAuth, (req, res) => {
  const { username } = req.params;
  if (req.session.user.username !== username && req.session.user.role !== 'admin')
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  const history = readHistory();
  res.json(history[username] || []);
});

// POST /api/history/:username
app.post('/api/history/:username', requireAuth, (req, res) => {
  const { username } = req.params;
  if (req.session.user.username !== username)
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  const history = readHistory();
  if (!history[username]) history[username] = [];
  history[username].unshift(req.body);
  if (history[username].length > 100) history[username] = history[username].slice(0, 100);
  writeHistory(history);
  res.json({ success: true });
});

// GET /api/users (admin)
app.get('/api/users', requireAdmin, (req, res) => {
  const users = readUsers().map(u => ({ username: u.username, name: u.name, role: u.role }));
  res.json(users);
});

// POST /api/users (admin)
app.post('/api/users', requireAdmin, (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'Username นี้มีอยู่แล้ว' });
  users.push({ username, password, name, role: 'user' });
  writeUsers(users);
  res.json({ success: true });
});

// DELETE /api/users/:username (admin)
app.delete('/api/users/:username', requireAdmin, (req, res) => {
  const { username } = req.params;
  if (username === req.session.user.username) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  let users = readUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  users.splice(idx, 1);
  writeUsers(users);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
  console.log('กด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์');
});
