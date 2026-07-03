const firestoreExamAttemptService = require('../services/firestoreExamAttemptService');

function isValidId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

function sendModelError(res, error) {
  if (error.name === 'ValidationError' || String(error.message).startsWith('ValidationError')) {
    const msg = error.errors ? Object.values(error.errors)[0].message : error.message.replace('ValidationError: ', '');
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: 'Unable to process exam attempt request' });
}

async function createExamAttempt(req, res) {
  try {
    const attempt = await firestoreExamAttemptService.createExamAttempt(req.body, req.user);
    return res.status(201).json(attempt);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('must be') || error.message.includes('ระยะเวลา')) {
      return res.status(400).json({ error: error.message });
    }
    return sendModelError(res, error);
  }
}

async function getExamAttempts(req, res) {
  try {
    const filters = {
      categoryId: req.query.categoryId,
      examSetId: req.query.examSetId,
      userId: req.query.userId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      limit: req.query.limit,
      page: req.query.page,
      startAfter: req.query.startAfter
    };

    const result = await firestoreExamAttemptService.getExamAttempts(filters, req.user);
    return res.json(result);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function getExamAttemptById(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam attempt id' });

  try {
    const attempt = await firestoreExamAttemptService.getExamAttemptById(req.params.id, req.user);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    return res.json(attempt);
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message });
    }
    return sendModelError(res, error);
  }
}

module.exports = { createExamAttempt, getExamAttempts, getExamAttemptById };
