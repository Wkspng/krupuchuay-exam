const mongoose = require('mongoose');
const Category = require('../models/Category');
const ExamSet = require('../models/ExamSet');
const Question = require('../models/Question');

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function asBoolean(value, fallback) {
  return value === undefined ? fallback : Boolean(value);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function shuffleChoices(question) {
  const choices = question.choices.map((choice, index) => ({ choice, isCorrect: index === question.correctAnswerIndex }));
  const randomized = shuffle(choices);
  return {
    ...question,
    choices: randomized.map((item) => item.choice),
    correctAnswerIndex: randomized.findIndex((item) => item.isCorrect),
  };
}

function modelError(res, error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(error.errors)[0].message });
  }
  return res.status(500).json({ error: 'Unable to process exam set request' });
}

async function normalizeRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) throw new Error('กรุณากำหนดสัดส่วนหมวดข้อสอบอย่างน้อย 1 หมวด');
  const categoryIds = new Set();
  const normalized = [];

  for (const rule of rules) {
    if (!rule || !isValidId(rule.categoryId)) throw new Error('หมวดข้อสอบในสัดส่วนไม่ถูกต้อง');
    if (!Number.isInteger(rule.questionCount) || rule.questionCount < 1) throw new Error('จำนวนข้อสอบของแต่ละหมวดต้องเป็นจำนวนเต็มอย่างน้อย 1 ข้อ');
    const categoryId = String(rule.categoryId);
    if (categoryIds.has(categoryId)) throw new Error('ไม่สามารถกำหนดหมวดข้อสอบซ้ำในชุดเดียวกันได้');
    categoryIds.add(categoryId);
    const category = await Category.findById(categoryId, 'name');
    if (!category) throw new Error('ไม่พบหมวดข้อสอบที่เลือก');
    normalized.push({ categoryId: category._id, categoryName: category.name, questionCount: rule.questionCount });
  }
  return normalized;
}

function validateBase(payload) {
  if (typeof payload.title !== 'string' || !payload.title.trim()) return 'กรุณาระบุชื่อชุดข้อสอบ';
  if (!['practice', 'exam'].includes(payload.mode)) return 'โหมดต้องเป็น practice หรือ exam';
  if (!Number.isInteger(payload.totalQuestions) || payload.totalQuestions < 1 || payload.totalQuestions > 200) return 'จำนวนข้อรวมต้องอยู่ระหว่าง 1 ถึง 200 ข้อ';
  if (!Number.isInteger(payload.timeLimitMinutes) || payload.timeLimitMinutes < 1 || payload.timeLimitMinutes > 600) return 'เวลาสอบต้องอยู่ระหว่าง 1 ถึง 600 นาที';
  if (typeof payload.passingScorePercent !== 'number' || payload.passingScorePercent < 0 || payload.passingScorePercent > 100) return 'คะแนนผ่านต้องอยู่ระหว่าง 0 ถึง 100';
  return null;
}

async function buildPayload(body, existing = {}) {
  const payload = {
    title: body.title !== undefined ? String(body.title).trim() : existing.title,
    description: body.description !== undefined ? String(body.description).trim() : (existing.description || ''),
    mode: body.mode !== undefined ? body.mode : existing.mode,
    totalQuestions: body.totalQuestions !== undefined ? Number(body.totalQuestions) : existing.totalQuestions,
    timeLimitMinutes: body.timeLimitMinutes !== undefined ? Number(body.timeLimitMinutes) : existing.timeLimitMinutes,
    passingScorePercent: body.passingScorePercent !== undefined ? Number(body.passingScorePercent) : existing.passingScorePercent,
    isActive: asBoolean(body.isActive, existing.isActive ?? true),
    randomizeQuestions: asBoolean(body.randomizeQuestions, existing.randomizeQuestions ?? true),
    randomizeChoices: asBoolean(body.randomizeChoices, existing.randomizeChoices ?? false),
    showExplanationAfterSubmit: asBoolean(body.showExplanationAfterSubmit, existing.showExplanationAfterSubmit ?? true),
  };
  payload.categoryRules = body.categoryRules !== undefined
    ? await normalizeRules(body.categoryRules)
    : (existing.categoryRules || []).map((rule) => ({ categoryId: rule.categoryId, categoryName: rule.categoryName, questionCount: rule.questionCount }));

  const validationError = validateBase(payload);
  if (validationError) throw new Error(validationError);
  const totalFromRules = payload.categoryRules.reduce((total, rule) => total + rule.questionCount, 0);
  if (totalFromRules !== payload.totalQuestions) throw new Error('ผลรวมจำนวนข้อในสัดส่วนหมวดต้องเท่ากับจำนวนข้อรวม');
  return payload;
}

async function getExamSets(req, res) {
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
  try {
    const sets = await ExamSet.find(includeInactive ? {} : { isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    return res.json(sets);
  } catch (error) {
    return modelError(res, error);
  }
}

async function getExamSetById(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });
  try {
    const set = await ExamSet.findById(req.params.id).populate('createdBy', 'name email');
    if (!set || (!set.isActive && req.user?.role !== 'admin')) return res.status(404).json({ error: 'ไม่พบชุดข้อสอบที่เปิดใช้งาน' });
    return res.json(set);
  } catch (error) {
    return modelError(res, error);
  }
}

async function createExamSet(req, res) {
  try {
    const payload = await buildPayload(req.body);
    const examSet = await ExamSet.create({ ...payload, createdBy: req.user.sub });
    return res.status(201).json(examSet);
  } catch (error) {
    if (error.name === 'Error') return res.status(400).json({ error: error.message });
    return modelError(res, error);
  }
}

async function updateExamSet(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });
  try {
    const existing = await ExamSet.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'ไม่พบชุดข้อสอบ' });
    const payload = await buildPayload(req.body, existing.toObject());
    const examSet = await ExamSet.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after', runValidators: true });
    return res.json(examSet);
  } catch (error) {
    if (error.name === 'Error') return res.status(400).json({ error: error.message });
    return modelError(res, error);
  }
}

async function deleteExamSet(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });
  try {
    const examSet = await ExamSet.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
    if (!examSet) return res.status(404).json({ error: 'ไม่พบชุดข้อสอบ' });
    return res.json({ success: true, message: 'ปิดใช้งานชุดข้อสอบแล้ว' });
  } catch (error) {
    return modelError(res, error);
  }
}

async function startExamSet(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });
  try {
    const examSet = await ExamSet.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!examSet) return res.status(404).json({ error: 'ไม่พบชุดข้อสอบที่เปิดใช้งาน' });

    const selections = [];
    for (const rule of examSet.categoryRules) {
      const match = { categoryId: new mongoose.Types.ObjectId(rule.categoryId), isActive: true };
      const available = await Question.countDocuments(match);
      if (available < rule.questionCount) {
        return res.status(409).json({
          error: `จำนวนข้อสอบในหมวดนี้ไม่เพียงพอ: ${rule.categoryName} (ต้องการ ${rule.questionCount} ข้อ มี ${available} ข้อ)`,
        categoryId: rule.categoryId,
        required: rule.questionCount,
        available,
      });
      }
      const questions = await Question.aggregate([{ $match: match }, { $sample: { size: rule.questionCount } }]);
      selections.push(...questions.map((question) => ({ ...question, categoryName: rule.categoryName })));
    }

    let questions = examSet.randomizeQuestions ? shuffle(selections) : selections;
    if (examSet.randomizeChoices) questions = questions.map(shuffleChoices);
    return res.json({
      examSetId: examSet._id,
      title: examSet.title,
      description: examSet.description,
      mode: examSet.mode,
      totalQuestions: examSet.totalQuestions,
      timeLimitMinutes: examSet.timeLimitMinutes,
      passingScorePercent: examSet.passingScorePercent,
      randomizeChoices: examSet.randomizeChoices,
      showExplanationAfterSubmit: examSet.showExplanationAfterSubmit,
      categoryRules: examSet.categoryRules,
      questions,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    return modelError(res, error);
  }
}

module.exports = { getExamSets, getExamSetById, createExamSet, updateExamSet, deleteExamSet, startExamSet };
