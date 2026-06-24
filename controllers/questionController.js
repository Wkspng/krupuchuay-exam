const firestoreQuestionService = require('../services/firestoreQuestionService');

function isValidId(id) {
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

async function getQuestions(req, res) {
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

  try {
    const result = await firestoreQuestionService.deleteQuestion(req.params.id);
    if (!result) return res.status(404).json({ error: 'Question not found' });
    return res.json({ success: true });
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function importQuestions(req, res) {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.questions;
    const result = await firestoreQuestionService.importQuestions(items);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = { getQuestions, getQuestionById, getRandomQuestions, createQuestion, updateQuestion, deleteQuestion, importQuestions };
