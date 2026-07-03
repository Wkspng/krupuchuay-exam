const { db } = require('../src/firebaseAdmin');
const { mapDoc } = require('./firestoreHelper');

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function shuffleChoices(question) {
  const choices = question.choices.map((choice, index) => ({
    choice,
    isCorrect: index === question.correctAnswerIndex
  }));
  const randomized = shuffle(choices);
  return {
    ...question,
    choices: randomized.map((item) => item.choice),
    correctAnswerIndex: randomized.findIndex((item) => item.isCorrect)
  };
}

async function normalizeRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error('กรุณากำหนดสัดส่วนหมวดข้อสอบอย่างน้อย 1 หมวด');
  }
  const categoryIds = new Set();
  const normalized = [];

  for (const rule of rules) {
    if (!rule || !rule.categoryId) {
      throw new Error('หมวดข้อสอบในสัดส่วนไม่ถูกต้อง');
    }
    if (!Number.isInteger(rule.questionCount) || rule.questionCount < 1) {
      throw new Error('จำนวนข้อสอบของแต่ละหมวดต้องเป็นจำนวนเต็มอย่างน้อย 1 ข้อ');
    }
    const categoryId = String(rule.categoryId);
    if (categoryIds.has(categoryId)) {
      throw new Error('ไม่สามารถกำหนดหมวดข้อสอบซ้ำในชุดเดียวกันได้');
    }
    categoryIds.add(categoryId);

    // Verify category exists
    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
      throw new Error('ไม่พบหมวดข้อสอบที่เลือก');
    }
    normalized.push({
      categoryId,
      categoryName: categoryDoc.data().name || '',
      questionCount: rule.questionCount
    });
  }
  return normalized;
}

function validateBase(payload) {
  if (typeof payload.title !== 'string' || !payload.title.trim()) {
    return 'กรุณาระบุชื่อชุดข้อสอบ';
  }
  if (!['practice', 'exam'].includes(payload.mode)) {
    return 'โหมดต้องเป็น practice หรือ exam';
  }
  if (!Number.isInteger(payload.totalQuestions) || payload.totalQuestions < 1 || payload.totalQuestions > 200) {
    return 'จำนวนข้อรวมต้องอยู่ระหว่าง 1 ถึง 200 ข้อ';
  }
  if (!Number.isInteger(payload.timeLimitMinutes) || payload.timeLimitMinutes < 1 || payload.timeLimitMinutes > 600) {
    return 'เวลาสอบต้องอยู่ระหว่าง 1 ถึง 600 นาที';
  }
  if (typeof payload.passingScorePercent !== 'number' || payload.passingScorePercent < 0 || payload.passingScorePercent > 100) {
    return 'คะแนนผ่านต้องอยู่ระหว่าง 0 ถึง 100';
  }
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
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : (existing.isActive ?? true),
    randomizeQuestions: body.randomizeQuestions !== undefined ? Boolean(body.randomizeQuestions) : (existing.randomizeQuestions ?? true),
    randomizeChoices: body.randomizeChoices !== undefined ? Boolean(body.randomizeChoices) : (existing.randomizeChoices ?? false),
    showExplanationAfterSubmit: body.showExplanationAfterSubmit !== undefined ? Boolean(body.showExplanationAfterSubmit) : (existing.showExplanationAfterSubmit ?? true),
  };

  payload.categoryRules = body.categoryRules !== undefined
    ? await normalizeRules(body.categoryRules)
    : (existing.categoryRules || []).map((rule) => ({
        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        questionCount: rule.questionCount
      }));

  const validationError = validateBase(payload);
  if (validationError) throw new Error(validationError);

  const totalFromRules = payload.categoryRules.reduce((total, rule) => total + rule.questionCount, 0);
  if (totalFromRules !== payload.totalQuestions) {
    throw new Error('ผลรวมจำนวนข้อในสัดส่วนหมวดต้องเท่ากับจำนวนข้อรวม');
  }

  return payload;
}

async function getExamSets(includeInactive = false) {
  let query = db.collection('examSets');
  if (!includeInactive) {
    query = query.where('isActive', '==', true);
  }

  const snapshot = await query.get();
    const rawSets = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) rawSets.push(mapped);
  });

  // Resolve creator user profiles in batch
  const uniqueCreatorIds = [...new Set(rawSets.map(s => s.createdBy).filter(Boolean))];
  const userMap = new Map();
  if (uniqueCreatorIds.length > 0) {
    const refs = uniqueCreatorIds.map(uid => db.collection('users').doc(uid));
    const snaps = await db.getAll(...refs);
    snaps.forEach(doc => {
      if (doc.exists) {
        userMap.set(doc.id, { name: doc.data().name || '', email: doc.data().email || '' });
      }
    });
  }

  const sets = rawSets.map(mapped => {
    const creator = userMap.get(mapped.createdBy);
    return {
      ...mapped,
      createdBy: creator
        ? { id: mapped.createdBy, _id: mapped.createdBy, ...creator }
        : { id: mapped.createdBy, _id: mapped.createdBy, name: 'ผู้ใช้งานระบบ', email: '' }
    };
  });

  // Sort by createdAt DESC
  sets.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return sets;
}

async function getExamSetById(id) {
  if (!id) return null;
  const doc = await db.collection('examSets').doc(id).get();
  if (!doc.exists) return null;

  const mapped = mapDoc(doc);
  
  // Populate creator
  if (mapped.createdBy) {
    const userDoc = await db.collection('users').doc(mapped.createdBy).get();
    if (userDoc.exists) {
      mapped.createdBy = {
        id: mapped.createdBy,
        _id: mapped.createdBy,
        name: userDoc.data().name || '',
        email: userDoc.data().email || ''
      };
    } else {
      mapped.createdBy = { id: mapped.createdBy, _id: mapped.createdBy, name: 'ผู้ใช้งานระบบ', email: '' };
    }
  }

  return mapped;
}

async function createExamSet(data, userId) {
  const payload = await buildPayload(data);
  const newDocRef = db.collection('examSets').doc();
  const examSetPayload = {
    ...payload,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    legacyMongoId: data.legacyMongoId || null
  };

  await newDocRef.set(examSetPayload);
  const createdDoc = await newDocRef.get();
  return mapDoc(createdDoc);
}

async function updateExamSet(id, data) {
  if (!id) throw new Error('Exam Set ID is required');
  const docRef = db.collection('examSets').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  const payload = await buildPayload(data, doc.data());
  payload.updatedAt = new Date();

  await docRef.update(payload);
  const updatedDoc = await docRef.get();
  return mapDoc(updatedDoc);
}

async function deleteExamSet(id) {
  if (!id) throw new Error('Exam Set ID is required');
  const docRef = db.collection('examSets').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  // Soft delete ExamSet
  await docRef.update({
    isActive: false,
    updatedAt: new Date()
  });

  return { success: true };
}

async function startExamSet(id) {
  if (!id) throw new Error('Exam Set ID is required');
  const examSetDoc = await db.collection('examSets').doc(id).get();
  if (!examSetDoc.exists || !examSetDoc.data().isActive) {
    return null;
  }

  const examSet = mapDoc(examSetDoc);
  const selections = [];

  for (const rule of examSet.categoryRules) {
    // Count active questions in category
    const activeQuestionsSnap = await db.collection('questions')
      .where('categoryId', '==', rule.categoryId)
      .where('isActive', '==', true)
      .get();
    
    const availableQuestions = [];
    activeQuestionsSnap.forEach(doc => {
      const mapped = mapDoc(doc);
      if (mapped) availableQuestions.push(mapped);
    });

    const available = availableQuestions.length;
    if (available < rule.questionCount) {
      const err = new Error(`จำนวนข้อสอบในหมวดนี้ไม่เพียงพอ: ${rule.categoryName} (ต้องการ ${rule.questionCount} ข้อ มี ${available} ข้อ)`);
      err.code = 'INSUFFICIENT_QUESTIONS';
      err.categoryId = rule.categoryId;
      err.required = rule.questionCount;
      err.available = available;
      throw err;
    }

    // Shuffle and slice rule.questionCount questions
    const shuffled = shuffle(availableQuestions);
    const selected = shuffled.slice(0, rule.questionCount);
    selections.push(...selected.map(q => ({ ...q, categoryName: rule.categoryName })));
  }

  let questions = examSet.randomizeQuestions ? shuffle(selections) : selections;
  if (examSet.randomizeChoices) {
    questions = questions.map(shuffleChoices);
  }

  return {
    examSetId: examSet.id,
    _id: examSet.id,
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
    startedAt: new Date().toISOString()
  };
}

module.exports = {
  getExamSets,
  getExamSetById,
  createExamSet,
  updateExamSet,
  deleteExamSet,
  startExamSet
};
