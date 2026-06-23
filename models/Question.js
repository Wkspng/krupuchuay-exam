const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  questionText: { type: String, required: true, trim: true },
  choices: {
    type: [String],
    required: true,
    validate: {
      validator: (choices) => Array.isArray(choices) && choices.length === 4 && choices.every((choice) => String(choice).trim().length > 0),
      message: 'choices must contain exactly four non-empty options',
    },
  },
  correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '', trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  source: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  // Used only by the seed script so it can be safely re-run without duplicating data.
  seedKey: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
