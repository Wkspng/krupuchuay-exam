const mongoose = require('mongoose');
const Category = require('../models/Category');
const Question = require('../models/Question');
const firestoreQuestionService = require('../services/firestoreQuestionService');

const dataSource = process.env.DATA_SOURCE || 'firestore';

function isValidId(id) {
  if (dataSource === 'mongo') {
    return mongoose.isValidObjectId(id);
  }
  return typeof id === 'string' && id.trim().length > 0;
}

function validateQuestion(body, partial = false) {
  if (!partial || body.questionText !== undefined) {
    if (typeof body.questionText !== 'string' || !body.questionText.trim()) return 'questionText is required';
  }
  if (!partial || body.choices !== undefined) {
    if (!Array.isArray(body.choices) || body.choices.length !== 4 || body.choices.some((choice) => typeof choice !== 'string' || !choice.trim())) {
      return 'choices must contain exactly four non-empty options';
    }
  }
  if (!partial || body.correctAnswerIndex !== undefined) {
    if (!Number.isInteger(body.correctAnswerIndex) || body.correctAnswerIndex < 0 || body.correctAnswerIndex > 3) {
      return 'correctAnswerIndex must be an integer from 0 to 3';
    }
  }
  if ((!partial || body.categoryId !== undefined) && !isValidId(body.categoryId)) return 'A valid categoryId is required';
  if (body.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(body.difficulty)) return 'difficulty must be easy, medium, or hard';
  return null;
}

function sendModelError(res, error) {
  if (error.name === 'ValidationError' || String(error.message).startsWith('ValidationError')) {
    const msg = error.errors ? Object.values(error.errors)[0].message : error.message.replace('ValidationError: ', '');
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: 'Unable to process question request' });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function questionPayload(body) {
  return {
    categoryId: body.categoryId,
    questionText: body.questionText.trim(),
    choices: body.choices.map((choice) => choice.trim()),
    correctAnswerIndex: body.correctAnswerIndex,
    explanation: body.explanation || '',
    difficulty: body.difficulty || 'medium',
    source: body.source || '',
    isActive: body.isActive ?? true,
  };
}

async function getQuestions(req, res) {
  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    const filter = {};
    const isAdmin = req.user?.role === 'admin';
    if (req.query.categoryId) {
      if (!isValidId(req.query.categoryId)) return res.status(400).json({ error: 'Invalid categoryId' });
      filter.categoryId = req.query.categoryId;
    }
    if (req.query.difficulty) {
      if (!['easy', 'medium', 'hard'].includes(req.query.difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });
      filter.difficulty = req.query.difficulty;
    }
    if ((req.query.includeInactive === 'true' || req.query.isActive === 'all' || req.query.isActive === 'false') && !isAdmin) {
      return res.status(403).json({ error: 'Administrator access is required to view inactive questions' });
    }
    if (req.query.isActive && req.query.isActive !== 'all') {
      if (!['true', 'false'].includes(req.query.isActive)) return res.status(400).json({ error: 'isActive must be true, false, or all' });
      filter.isActive = req.query.isActive === 'true';
    } else if (req.query.includeInactive !== 'true') {
      filter.isActive = true;
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      filter.questionText = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
    }

    try {
      const questions = await Question.find(filter).sort({ createdAt: -1 }).limit(500);
      return res.json(questions);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const isAdmin = req.user?.role === 'admin';
    if ((req.query.includeInactive === 'true' || req.query.isActive === 'all' || req.query.isActive === 'false') && !isAdmin) {
      return res.status(403).json({ error: 'Administrator access is required to view inactive questions' });
    }

    const filters = {
      categoryId: req.query.categoryId,
      difficulty: req.query.difficulty,
      isActive: req.query.isActive,
      search: req.query.search,
      includeInactive: req.query.includeInactive === 'true'
    };

    const questions = await firestoreQuestionService.getQuestions(filters);
    return res.json(questions);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function getQuestionById(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid question id' });

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    try {
      const filter = { _id: req.params.id };
      if (req.query.includeInactive === 'true' && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access is required to view inactive questions' });
      }
      if (req.query.includeInactive !== 'true') filter.isActive = true;
      const question = await Question.findOne(filter);
      if (!question) return res.status(404).json({ error: 'Question not found' });
      return res.json(question);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    if (req.query.includeInactive === 'true' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access is required to view inactive questions' });
    }

    const question = await firestoreQuestionService.getQuestionById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    if (req.query.includeInactive !== 'true' && !question.isActive) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json(question);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function getRandomQuestions(req, res) {
  let limit = Number.parseInt(req.query.limit, 10);
  if (Number.isNaN(limit)) limit = 10;
  if (limit < 1 || limit > 100) return res.status(400).json({ error: 'limit must be between 1 and 100' });

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    const match = { isActive: true };
    if (req.query.categoryId) {
      if (!isValidId(req.query.categoryId)) return res.status(400).json({ error: 'Invalid categoryId' });
      match.categoryId = new mongoose.Types.ObjectId(req.query.categoryId);
    }
    try {
      const questions = await Question.aggregate([{ $match: match }, { $sample: { size: limit } }]);
      return res.json(questions);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    if (req.query.categoryId && !isValidId(req.query.categoryId)) {
      return res.status(400).json({ error: 'Invalid categoryId' });
    }
    const questions = await firestoreQuestionService.getRandomQuestions(req.query.categoryId, limit);
    return res.json(questions);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function createQuestion(req, res) {
  const validationError = validateQuestion(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    try {
      const category = await Category.exists({ _id: req.body.categoryId });
      if (!category) return res.status(400).json({ error: 'categoryId does not exist' });
      const question = await Question.create(questionPayload(req.body));
      return res.status(201).json(question);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const question = await firestoreQuestionService.createQuestion(req.body);
    return res.status(201).json(question);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function updateQuestion(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid question id' });
  const validationError = validateQuestion(req.body, true);
  if (validationError) return res.status(400).json({ error: validationError });

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    const updates = {};
    ['categoryId', 'questionText', 'choices', 'correctAnswerIndex', 'explanation', 'difficulty', 'source', 'isActive'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (updates.questionText) updates.questionText = updates.questionText.trim();
    if (updates.choices) updates.choices = updates.choices.map((choice) => choice.trim());

    try {
      if (updates.categoryId && !(await Category.exists({ _id: updates.categoryId }))) {
        return res.status(400).json({ error: 'categoryId does not exist' });
      }
      const question = await Question.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
      if (!question) return res.status(404).json({ error: 'Question not found' });
      return res.json(question);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const question = await firestoreQuestionService.updateQuestion(req.params.id, req.body);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    return res.json(question);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function deleteQuestion(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid question id' });

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    try {
      const question = await Question.findByIdAndDelete(req.params.id);
      if (!question) return res.status(404).json({ error: 'Question not found' });
      return res.json({ success: true });
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const result = await firestoreQuestionService.deleteQuestion(req.params.id);
    if (!result) return res.status(404).json({ error: 'Question not found' });
    return res.json({ success: true });
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function importQuestions(req, res) {
  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    const items = Array.isArray(req.body) ? req.body : req.body.questions;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'questions must be a non-empty JSON array' });
    if (items.length > 500) return res.status(400).json({ error: 'A maximum of 500 questions can be imported at once' });

    try {
      const categories = await Category.find({}, 'name');
      const categoryByName = new Map(categories.map((category) => [category.name.trim().toLowerCase(), category]));
      const failed = [];
      const candidates = [];
      const seen = new Set();

      items.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          failed.push({ index, error: 'Each import item must be an object' });
          return;
        }
        const categoryName = typeof item.categoryName === 'string' ? item.categoryName.trim() : '';
        const category = categoryByName.get(categoryName.toLowerCase());
        if (!category) {
          failed.push({ index, error: 'Category was not found' });
          return;
        }
        const candidate = { ...item, categoryId: category._id.toString(), isActive: item.isActive ?? true };
        const validationError = validateQuestion(candidate);
        if (validationError) {
          failed.push({ index, error: validationError });
          return;
        }
        const duplicateKey = `${candidate.categoryId}:${candidate.questionText.trim().toLowerCase()}`;
        if (seen.has(duplicateKey)) {
          failed.push({ index, error: 'Duplicate question in import file' });
          return;
        }
        seen.add(duplicateKey);
        candidates.push({ index, payload: questionPayload(candidate) });
      });

      let imported = 0;
      for (const candidate of candidates) {
        const duplicate = await Question.exists({
          categoryId: candidate.payload.categoryId,
          questionText: { $regex: `^${escapeRegex(candidate.payload.questionText)}$`, $options: 'i' },
        });
        if (duplicate) {
          failed.push({ index: candidate.index, error: 'Duplicate question already exists in this category' });
          continue;
        }
        await Question.create(candidate.payload);
        imported += 1;
      }

      return res.status(201).json({ imported, failed: failed.length, errors: failed.slice(0, 50) });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to import questions' });
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.questions;
    const result = await firestoreQuestionService.importQuestions(items);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = { getQuestions, getQuestionById, getRandomQuestions, createQuestion, updateQuestion, deleteQuestion, importQuestions };
