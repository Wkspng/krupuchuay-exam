const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText: { type: String },
  choices: { type: [String], default: undefined },
  selectedAnswerIndex: { type: Number, min: 0, max: 3 },
  correctAnswerIndex: { type: Number, min: 0, max: 3 },
  isCorrect: { type: Boolean },
  explanation: { type: String },
}, { _id: false });

const examAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  guestName: { type: String, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  categoryName: { type: String, trim: true },
  examSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSet', index: true },
  examSetTitle: { type: String, trim: true },
  passed: { type: Boolean, default: undefined },
  showExplanationAfterSubmit: { type: Boolean, default: undefined },
  mode: { type: String, enum: ['practice', 'exam'], required: true },
  totalQuestions: { type: Number, required: true, min: 1 },
  correctCount: { type: Number, required: true, min: 0 },
  scorePercent: { type: Number, required: true, min: 0, max: 100 },
  answers: { type: [answerSchema], default: [] },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

examAttemptSchema.pre('validate', function validateOwner() {
  if (!this.userId && !this.guestName) {
    throw new Error('userId or guestName is required');
  }
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
