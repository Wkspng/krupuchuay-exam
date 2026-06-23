const mongoose = require('mongoose');

const categoryRuleSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  categoryName: { type: String, required: true, trim: true },
  questionCount: { type: Number, required: true, min: 1 },
}, { _id: false });

const examSetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  mode: { type: String, enum: ['practice', 'exam'], default: 'exam', required: true },
  totalQuestions: { type: Number, required: true, min: 1, max: 200 },
  timeLimitMinutes: { type: Number, required: true, min: 1, max: 600 },
  passingScorePercent: { type: Number, required: true, min: 0, max: 100 },
  isActive: { type: Boolean, default: true, index: true },
  categoryRules: {
    type: [categoryRuleSchema],
    required: true,
    validate: {
      validator: (rules) => Array.isArray(rules) && rules.length > 0,
      message: 'categoryRules must contain at least one category',
    },
  },
  randomizeQuestions: { type: Boolean, default: true },
  randomizeChoices: { type: Boolean, default: false },
  showExplanationAfterSubmit: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seedKey: { type: String, unique: true, sparse: true },
}, { timestamps: true });

examSetSchema.pre('validate', function validateRuleTotals() {
  const totalFromRules = (this.categoryRules || []).reduce((total, rule) => total + (Number(rule.questionCount) || 0), 0);
  if (this.totalQuestions && totalFromRules !== this.totalQuestions) {
    this.invalidate('categoryRules', 'The total of categoryRules.questionCount must equal totalQuestions');
  }
});

module.exports = mongoose.model('ExamSet', examSetSchema);
