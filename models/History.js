const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  subjectId: String,
  subjectName: String,
  icon: String,
  partShort: String,
  partId: String,
  correct: Number,
  total: Number,
  pct: Number,
  elapsed: Number,
  date: String,
  answers: Array,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('History', historySchema);
