const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'admin' หรือ 'user'
  status: { type: String, default: 'pending' }, // 'approved' | 'pending' | 'rejected'
  registeredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
