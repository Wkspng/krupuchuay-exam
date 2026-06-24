const mongoose = require('mongoose');
const Category = require('../models/Category');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSet = require('../models/ExamSet');
const firestoreExamAttemptService = require('../services/firestoreExamAttemptService');

const dataSource = process.env.DATA_SOURCE || 'firestore';

function isValidId(id) {
  if (dataSource === 'mongo') {
    return mongoose.isValidObjectId(id);
  }
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
  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    function parseDate(value) {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    function normalizeAnswers(answers) {
      if (!Array.isArray(answers)) return [];
      return answers.map((answer) => {
        const selectedAnswerIndex = Number.isInteger(answer.selectedAnswerIndex) && answer.selectedAnswerIndex >= 0 ? answer.selectedAnswerIndex : undefined;
        const correctAnswerIndex = Number.isInteger(answer.correctAnswerIndex) ? answer.correctAnswerIndex : undefined;
        return {
          questionId: mongoose.isValidObjectId(answer.questionId) ? answer.questionId : undefined,
          questionText: typeof answer.questionText === 'string' ? answer.questionText : undefined,
          choices: Array.isArray(answer.choices) && answer.choices.length === 4 ? answer.choices.map((choice) => String(choice)) : undefined,
          selectedAnswerIndex,
          correctAnswerIndex,
          isCorrect: correctAnswerIndex !== undefined ? selectedAnswerIndex === correctAnswerIndex : Boolean(answer.isCorrect),
          explanation: typeof answer.explanation === 'string' ? answer.explanation : undefined,
        };
      });
    }
    function validateAttempt(body, authenticated) {
      if (!authenticated && (typeof body.guestName !== 'string' || !body.guestName.trim())) return 'guestName is required for guest attempts';
      if (!mongoose.isValidObjectId(body.categoryId)) return 'A valid categoryId is required';
      if (!['practice', 'exam'].includes(body.mode)) return 'mode must be practice or exam';
      if (!Number.isInteger(body.totalQuestions) || body.totalQuestions < 1) return 'totalQuestions must be at least 1';
      if (!Number.isInteger(body.correctCount) || body.correctCount < 0 || body.correctCount > body.totalQuestions) return 'correctCount is invalid';
      if (body.answers !== undefined && !Array.isArray(body.answers)) return 'answers must be an array';
      if (body.answers?.some((answer) => answer && answer.selectedAnswerIndex !== undefined && answer.selectedAnswerIndex !== -1 && (!Number.isInteger(answer.selectedAnswerIndex) || answer.selectedAnswerIndex < 0 || answer.selectedAnswerIndex > 3))) {
        return 'answer selectedAnswerIndex must be from 0 to 3';
      }
      return null;
    }

    const validationError = validateAttempt(req.body, Boolean(req.user));
    if (validationError) return res.status(400).json({ error: validationError });

    try {
      const category = await Category.findById(req.body.categoryId, 'name');
      if (!category) return res.status(400).json({ error: 'categoryId does not exist' });

      const totalQuestions = req.body.totalQuestions;
      const submittedAt = parseDate(req.body.submittedAt) || new Date();
      const startedAt = parseDate(req.body.startedAt) || submittedAt;
      const answers = normalizeAnswers(req.body.answers);
      const derivedCorrectCount = answers.length && answers.some((answer) => answer.correctAnswerIndex !== undefined)
        ? answers.filter((answer) => answer.isCorrect).length
        : req.body.correctCount;
      const durationSeconds = Number.isInteger(req.body.durationSeconds) && req.body.durationSeconds >= 0 ? req.body.durationSeconds : 0;
      let examSet;
      if (req.body.examSetId !== undefined) {
        if (!mongoose.isValidObjectId(req.body.examSetId)) return res.status(400).json({ error: 'Invalid examSetId' });
        examSet = await ExamSet.findById(req.body.examSetId, 'title mode timeLimitMinutes passingScorePercent showExplanationAfterSubmit');
        if (!examSet) return res.status(400).json({ error: 'ไม่พบชุดข้อสอบ' });
        if (examSet.mode === 'exam' && durationSeconds > (examSet.timeLimitMinutes * 60) + 120) {
          return res.status(400).json({ error: 'ระยะเวลาสอบเกินกว่าที่ชุดข้อสอบกำหนด' });
        }
      }
      const attempt = await ExamAttempt.create({
        userId: req.user?.sub,
        guestName: req.user ? undefined : req.body.guestName.trim(),
        categoryId: category._id,
        categoryName: category.name,
        examSetId: examSet?._id,
        examSetTitle: examSet?.title,
        passed: examSet ? Number(((derivedCorrectCount / totalQuestions) * 100).toFixed(2)) >= examSet.passingScorePercent : undefined,
        showExplanationAfterSubmit: examSet?.showExplanationAfterSubmit,
        mode: examSet?.mode || req.body.mode,
        totalQuestions,
        correctCount: derivedCorrectCount,
        scorePercent: Number(((derivedCorrectCount / totalQuestions) * 100).toFixed(2)),
        answers,
        startedAt,
        submittedAt,
        durationSeconds,
      });
      return res.status(201).json(attempt);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const attempt = await firestoreExamAttemptService.createExamAttempt(req.body, req.user);
    return res.status(201).json(attempt);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function getExamAttempts(req, res) {
  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    function parseDate(value) {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const filter = {};
    const isAdmin = req.user.role === 'admin';

    if (isAdmin && req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) return res.status(400).json({ error: 'Invalid userId' });
      filter.userId = req.query.userId;
    } else if (!isAdmin) {
      filter.userId = req.user.sub;
    }
    if (req.query.categoryId) {
      if (!mongoose.isValidObjectId(req.query.categoryId)) return res.status(400).json({ error: 'Invalid categoryId' });
      filter.categoryId = req.query.categoryId;
    }

    const dateFrom = parseDate(req.query.dateFrom);
    const dateTo = parseDate(req.query.dateTo);
    if (req.query.dateFrom && !dateFrom) return res.status(400).json({ error: 'Invalid dateFrom' });
    if (req.query.dateTo && !dateTo) return res.status(400).json({ error: 'Invalid dateTo' });
    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom) filter.submittedAt.$gte = dateFrom;
      if (dateTo) { dateTo.setHours(23, 59, 59, 999); filter.submittedAt.$lte = dateTo; }
    }

    let limit = Number.parseInt(req.query.limit, 10);
    let page = Number.parseInt(req.query.page, 10);
    if (Number.isNaN(limit)) limit = 20;
    if (Number.isNaN(page)) page = 1;
    limit = Math.min(Math.max(limit, 1), 100);
    page = Math.max(page, 1);

    try {
      const [total, attempts] = await Promise.all([
        ExamAttempt.countDocuments(filter),
        ExamAttempt.find(filter)
          .populate('userId', 'name email username role')
          .sort({ submittedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
      ]);
      return res.json({ attempts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const result = await firestoreExamAttemptService.getExamAttempts(req.query, req.user);
    return res.json(result);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function getExamAttemptById(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam attempt id' });

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    try {
      const filter = { _id: req.params.id };
      if (req.user.role !== 'admin') filter.userId = req.user.sub;
      const attempt = await ExamAttempt.findOne(filter).populate('userId', 'name email username role').populate('categoryId', 'name');
      if (!attempt) return res.status(404).json({ error: 'Exam attempt not found' });
      const result = attempt.toObject();
      if (req.user.role !== 'admin' && result.showExplanationAfterSubmit === false) {
        result.answers = result.answers.map((answer) => {
          const { correctAnswerIndex, explanation, ...safeAnswer } = answer;
          return safeAnswer;
        });
      }
      return res.json(result);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const attempt = await firestoreExamAttemptService.getExamAttemptById(req.params.id, req.user);
    if (!attempt) return res.status(404).json({ error: 'Exam attempt not found' });
    return res.json(attempt);
  } catch (error) {
    return sendModelError(res, error);
  }
}

module.exports = { createExamAttempt, getExamAttempts, getExamAttemptById };
