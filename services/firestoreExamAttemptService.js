const { db } = require('../src/firebaseAdmin');
const { mapDoc } = require('./firestoreHelper');

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
      questionId: answer.questionId || undefined,
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
  if (!authenticated && (typeof body.guestName !== 'string' || !body.guestName.trim())) {
    return 'guestName is required for guest attempts';
  }
  if (!body.categoryId) return 'A valid categoryId is required';
  if (!['practice', 'exam'].includes(body.mode)) return 'mode must be practice or exam';
  if (!Number.isInteger(body.totalQuestions) || body.totalQuestions < 1) return 'totalQuestions must be at least 1';
  if (!Number.isInteger(body.correctCount) || body.correctCount < 0 || body.correctCount > body.totalQuestions) {
    return 'correctCount is invalid';
  }
  if (body.answers !== undefined && !Array.isArray(body.answers)) return 'answers must be an array';
  if (body.answers?.some((answer) => answer && answer.selectedAnswerIndex !== undefined && answer.selectedAnswerIndex !== -1 && (!Number.isInteger(answer.selectedAnswerIndex) || answer.selectedAnswerIndex < 0 || answer.selectedAnswerIndex > 3))) {
    return 'answer selectedAnswerIndex must be from 0 to 3';
  }
  return null;
}

async function createExamAttempt(data, user) {
  const validationError = validateAttempt(data, Boolean(user));
  if (validationError) {
    throw new Error(`ValidationError: ${validationError}`);
  }

  // Verify category exists
  const categoryDoc = await db.collection('categories').doc(data.categoryId).get();
  if (!categoryDoc.exists) {
    throw new Error('ValidationError: categoryId does not exist');
  }

  const totalQuestions = data.totalQuestions;
  const submittedAt = parseDate(data.submittedAt) || new Date();
  const startedAt = parseDate(data.startedAt) || submittedAt;
  const answers = normalizeAnswers(data.answers);
  const derivedCorrectCount = answers.length && answers.some((answer) => answer.correctAnswerIndex !== undefined)
    ? answers.filter((answer) => answer.isCorrect).length
    : data.correctCount;
  
  const durationSeconds = Number.isInteger(data.durationSeconds) && data.durationSeconds >= 0 ? data.durationSeconds : 0;
  
  let examSet;
  if (data.examSetId !== undefined) {
    const examSetDoc = await db.collection('examSets').doc(data.examSetId).get();
    if (!examSetDoc.exists) {
      throw new Error('ValidationError: ไม่พบชุดข้อสอบ');
    }
    examSet = examSetDoc.data();
    examSet.id = examSetDoc.id;
    if (examSet.mode === 'exam' && durationSeconds > (examSet.timeLimitMinutes * 60) + 120) {
      throw new Error('ValidationError: ระยะเวลาสอบเกินกว่าที่ชุดข้อสอบกำหนด');
    }
  }

  const newDocRef = db.collection('examAttempts').doc();
  const attemptPayload = {
    userId: user?.sub || null,
    guestName: user ? null : data.guestName.trim(),
    categoryId: categoryDoc.id,
    categoryName: categoryDoc.data().name || '',
    examSetId: examSet?.id || null,
    examSetTitle: examSet?.title || null,
    passed: examSet ? Number(((derivedCorrectCount / totalQuestions) * 100).toFixed(2)) >= examSet.passingScorePercent : null,
    showExplanationAfterSubmit: examSet ? (examSet.showExplanationAfterSubmit ?? true) : null,
    mode: examSet?.mode || data.mode,
    totalQuestions,
    correctCount: derivedCorrectCount,
    scorePercent: Number(((derivedCorrectCount / totalQuestions) * 100).toFixed(2)),
    answers,
    startedAt,
    submittedAt,
    durationSeconds,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Add user information if user is logged in
  if (user) {
    const userDoc = await db.collection('users').doc(user.sub).get();
    if (userDoc.exists) {
      attemptPayload.userName = userDoc.data().name || '';
      attemptPayload.userEmail = userDoc.data().email || '';
    } else {
      attemptPayload.userName = user.name || '';
      attemptPayload.userEmail = user.email || '';
    }
  }

  await newDocRef.set(attemptPayload);
  const createdDoc = await newDocRef.get();
  return mapDoc(createdDoc);
}

async function getExamAttempts({ userId, categoryId, examSetId, dateFrom, dateTo, limit, page } = {}, user) {
  const isAdmin = user.role === 'admin';
  let targetUserId = null;

  if (isAdmin && userId) {
    targetUserId = userId;
  } else if (!isAdmin) {
    targetUserId = user.sub;
  }

  // Build target query in Firestore
  let query = db.collection('examAttempts');
  if (targetUserId) {
    query = query.where('userId', '==', targetUserId);
  } else if (categoryId) {
    query = query.where('categoryId', '==', categoryId);
  } else if (examSetId) {
    query = query.where('examSetId', '==', examSetId);
  }

  // Safety: Limit maximum documents fetched to 1000
  query = query.limit(1000);

  const snapshot = await query.get();
  let attempts = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) attempts.push(mapped);
  });

  // In-memory sort by submittedAt DESC
  attempts.sort((a, b) => {
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return timeB - timeA;
  });

  // Apply secondary filters in-memory
  // Filter by userId if not matched in query
  if (!targetUserId && userId) {
    attempts = attempts.filter(a => a.userId === userId);
  }
  // Filter by categoryId if not matched in query
  if (targetUserId && categoryId) {
    attempts = attempts.filter(a => a.categoryId === categoryId);
  }
  // Filter by examSetId if not matched in query
  if ((targetUserId || categoryId) && examSetId) {
    attempts = attempts.filter(a => a.examSetId === examSetId);
  }
  // Date filters
  const parsedFrom = parseDate(dateFrom);
  const parsedTo = parseDate(dateTo);
  if (parsedFrom) {
    attempts = attempts.filter(a => a.submittedAt && new Date(a.submittedAt) >= parsedFrom);
  }
  if (parsedTo) {
    parsedTo.setHours(23, 59, 59, 999);
    attempts = attempts.filter(a => a.submittedAt && new Date(a.submittedAt) <= parsedTo);
  }

  // In-memory pagination first
  let pageNum = Number.parseInt(page, 10);
  let limitNum = Number.parseInt(limit, 10);
  if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 20;
  limitNum = Math.min(Math.max(limitNum, 1), 100); // cap limit at 100

  const total = attempts.length;
  const pages = Math.ceil(total / limitNum);
  const offset = (pageNum - 1) * limitNum;
  const paginatedAttempts = attempts.slice(offset, offset + limitNum);

  // Populate user data only for the sliced page attempts
  const uniqueUserIds = [...new Set(paginatedAttempts.map(a => a.userId).filter(Boolean))];
  const userMap = new Map();
  if (uniqueUserIds.length > 0) {
    const refs = uniqueUserIds.map(uid => db.collection('users').doc(uid));
    const snaps = await db.getAll(...refs);
    snaps.forEach(doc => {
      if (doc.exists) {
        userMap.set(doc.id, {
          name: doc.data().name || '',
          email: doc.data().email || '',
          username: doc.data().username || doc.data().email || '',
          role: doc.data().role || 'user'
        });
      }
    });
  }

  const mappedAttempts = paginatedAttempts.map(a => {
    if (a.userId && userMap.has(a.userId)) {
      const u = userMap.get(a.userId);
      return {
        ...a,
        userId: {
          id: a.userId,
          _id: a.userId,
          ...u
        }
      };
    } else if (a.userId) {
      return {
        ...a,
        userId: {
          id: a.userId,
          _id: a.userId,
          name: 'ผู้ใช้ระบบ',
          email: ''
        }
      };
    }
    return a;
  });

  return {
    attempts: mappedAttempts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages
    }
  };
}

async function getExamAttemptById(id, user) {
  if (!id) return null;
  const doc = await db.collection('examAttempts').doc(id).get();
  if (!doc.exists) return null;

  const attempt = mapDoc(doc);
  
  // Normal users can only see their own attempts
  if (user.role !== 'admin' && attempt.userId !== user.sub) {
    return null;
  }

  // Resolve user info
  if (attempt.userId) {
    const userDoc = await db.collection('users').doc(attempt.userId).get();
    if (userDoc.exists) {
      attempt.userId = {
        id: attempt.userId,
        _id: attempt.userId,
        name: userDoc.data().name || '',
        email: userDoc.data().email || '',
        username: userDoc.data().username || userDoc.data().email || '',
        role: userDoc.data().role || 'user'
      };
    } else {
      attempt.userId = { id: attempt.userId, _id: attempt.userId, name: 'ผู้ใช้งานระบบ', email: '' };
    }
  }

  // Strip explanations if normal user and showExplanationAfterSubmit is false
  if (user.role !== 'admin' && attempt.showExplanationAfterSubmit === false) {
    attempt.answers = (attempt.answers || []).map((answer) => {
      const { correctAnswerIndex, explanation, ...safeAnswer } = answer;
      return safeAnswer;
    });
  }

  return attempt;
}

module.exports = {
  createExamAttempt,
  getExamAttempts,
  getExamAttemptById
};
