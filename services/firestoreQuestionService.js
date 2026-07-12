const { db } = require('../src/firebaseAdmin');
const { mapDoc } = require('./firestoreHelper');
const firestoreExamPackService = require('./firestoreExamPackService');

async function getQuestions({ categoryId, difficulty, isActive, search, includeInactive } = {}) {
  let query = db.collection('questions');

  if (categoryId) {
    query = query.where('categoryId', '==', categoryId);
  }
  if (difficulty) {
    query = query.where('difficulty', '==', difficulty);
  }

  // Handle active/inactive filters
  if (isActive !== undefined && isActive !== 'all') {
    const activeBool = isActive === 'true' || isActive === true;
    query = query.where('isActive', '==', activeBool);
  } else if (includeInactive !== true && includeInactive !== 'true') {
    query = query.where('isActive', '==', true);
  }

  const snapshot = await query.get();
  let questions = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) questions.push(mapped);
  });

  // Filter in-memory for case-insensitive substring search of questionText
  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim().toLowerCase();
    questions = questions.filter(q => String(q.questionText || '').toLowerCase().includes(term));
  }

  // In-memory sort by createdAt DESC
  questions.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Enforce query limit cap: max 500 records
  return questions.slice(0, 500);
}

async function getQuestionById(id) {
  if (!id) return null;
  const doc = await db.collection('questions').doc(id).get();
  return mapDoc(doc);
}

async function getRandomQuestions(categoryId, limit = 10) {
  const finalLimit = Math.min(Math.max(limit, 1), 500);

  if (categoryId) {
    try {
      const packQuestions = await firestoreExamPackService.getRandomQuestionsFromPack(categoryId, finalLimit);
      if (packQuestions !== null) {
        const indexData = await firestoreExamPackService.getPublishedCategoryPack(categoryId);
        const result = packQuestions;
        result.packVersion = indexData ? indexData.version : null;
        result.categoryId = categoryId;
        result.generatedFromPack = true;
        return result;
      }
      console.warn(`[EXAM-PACK-WARNING] No published or fresh exam pack found for category ${categoryId}. Falling back to database query.`);
    } catch (err) {
      console.error(`Error loading from exam pack for category ${categoryId}:`, err);
    }
  }

  let query = db.collection('questions').where('isActive', '==', true);
  if (categoryId) {
    query = query.where('categoryId', '==', categoryId);
  }

  const snapshot = await query.get();
  const questions = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) questions.push(mapped);
  });

  // Shuffle in-memory
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  const fallbackResult = questions.slice(0, finalLimit);
  fallbackResult.packVersion = null;
  fallbackResult.categoryId = categoryId || null;
  fallbackResult.generatedFromPack = false;
  return fallbackResult;
}

async function createQuestion(data) {
  // Validate question parameters
  if (!data.questionText || !String(data.questionText).trim()) {
    throw new Error('ValidationError: questionText is required');
  }
  if (!Array.isArray(data.choices) || data.choices.length !== 4 || data.choices.some(c => typeof c !== 'string' || !c.trim())) {
    throw new Error('ValidationError: choices must contain exactly four non-empty options');
  }
  if (!Number.isInteger(data.correctAnswerIndex) || data.correctAnswerIndex < 0 || data.correctAnswerIndex > 3) {
    throw new Error('ValidationError: correctAnswerIndex must be an integer from 0 to 3');
  }
  if (!data.categoryId) {
    throw new Error('ValidationError: A valid categoryId is required');
  }

  // Verify category exists
  const categoryDoc = await db.collection('categories').doc(data.categoryId).get();
  if (!categoryDoc.exists) {
    throw new Error('ValidationError: categoryId does not exist');
  }

  const newDocRef = db.collection('questions').doc();
  const payload = {
    categoryId: data.categoryId,
    categoryName: categoryDoc.data().name || '',
    questionText: String(data.questionText).trim(),
    choices: data.choices.map(c => String(c).trim()),
    correctAnswerIndex: data.correctAnswerIndex,
    explanation: (data.explanation || '').trim(),
    difficulty: data.difficulty || 'medium',
    source: (data.source || '').trim(),
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    legacyMongoId: data.legacyMongoId || null
  };

  await newDocRef.set(payload);
  const createdDoc = await newDocRef.get();

  // Mark category pack as stale
  firestoreExamPackService.markPackStale(data.categoryId);

  return mapDoc(createdDoc);
}

async function updateQuestion(id, data) {
  if (!id) throw new Error('Question ID is required');
  const docRef = db.collection('questions').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }

  const updates = {};
  if (data.categoryId !== undefined) {
    const categoryDoc = await db.collection('categories').doc(data.categoryId).get();
    if (!categoryDoc.exists) {
      throw new Error('ValidationError: categoryId does not exist');
    }
    updates.categoryId = data.categoryId;
    updates.categoryName = categoryDoc.data().name || '';
  }

  if (data.questionText !== undefined) {
    if (typeof data.questionText !== 'string' || !data.questionText.trim()) {
      throw new Error('ValidationError: questionText is required');
    }
    updates.questionText = data.questionText.trim();
  }

  if (data.choices !== undefined) {
    if (!Array.isArray(data.choices) || data.choices.length !== 4 || data.choices.some(c => typeof c !== 'string' || !c.trim())) {
      throw new Error('ValidationError: choices must contain exactly four non-empty options');
    }
    updates.choices = data.choices.map(c => String(c).trim());
  }

  if (data.correctAnswerIndex !== undefined) {
    if (!Number.isInteger(data.correctAnswerIndex) || data.correctAnswerIndex < 0 || data.correctAnswerIndex > 3) {
      throw new Error('ValidationError: correctAnswerIndex must be an integer from 0 to 3');
    }
    updates.correctAnswerIndex = data.correctAnswerIndex;
  }

  if (data.explanation !== undefined) {
    updates.explanation = String(data.explanation).trim();
  }
  if (data.difficulty !== undefined) {
    if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
      throw new Error('ValidationError: difficulty must be easy, medium, or hard');
    }
    updates.difficulty = data.difficulty;
  }
  if (data.source !== undefined) {
    updates.source = String(data.source).trim();
  }
  if (data.isActive !== undefined) {
    updates.isActive = Boolean(data.isActive);
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await docRef.update(updates);
  }

  const updatedDoc = await docRef.get();
  
  // Mark pack stale for current category and old category (if changed)
  const newCatId = updatedDoc.data().categoryId;
  const oldCatId = doc.data().categoryId;
  firestoreExamPackService.markPackStale(newCatId);
  if (oldCatId && oldCatId !== newCatId) {
    firestoreExamPackService.markPackStale(oldCatId);
  }

  return mapDoc(updatedDoc);
}

async function deleteQuestion(id) {
  if (!id) throw new Error('Question ID is required');
  const docRef = db.collection('questions').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }

  // Soft delete Question
  await docRef.update({
    isActive: false,
    updatedAt: new Date()
  });

  // Mark category pack as stale
  const catId = doc.data().categoryId;
  firestoreExamPackService.markPackStale(catId);

  return { success: true };
}

async function importQuestions(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('questions must be a non-empty JSON array');
  }
  if (items.length > 500) {
    throw new Error('A maximum of 500 questions can be imported at once');
  }

  // Fetch all categories to lookup categoryName -> categoryId
  const categorySnapshot = await db.collection('categories').get();
  const categoryByName = new Map();
  categorySnapshot.forEach(doc => {
    categoryByName.set(String(doc.data().name || '').trim().toLowerCase(), {
      id: doc.id,
      name: doc.data().name
    });
  });

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

    const candidate = {
      ...item,
      categoryId: category.id,
      categoryName: category.name,
      isActive: item.isActive ?? true
    };

    // Inline validations
    if (typeof candidate.questionText !== 'string' || !candidate.questionText.trim()) {
      failed.push({ index, error: 'questionText is required' });
      return;
    }
    if (!Array.isArray(candidate.choices) || candidate.choices.length !== 4 || candidate.choices.some(c => typeof c !== 'string' || !c.trim())) {
      failed.push({ index, error: 'choices must contain exactly four non-empty options' });
      return;
    }
    if (!Number.isInteger(candidate.correctAnswerIndex) || candidate.correctAnswerIndex < 0 || candidate.correctAnswerIndex > 3) {
      failed.push({ index, error: 'correctAnswerIndex must be an integer from 0 to 3' });
      return;
    }
    if (candidate.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(candidate.difficulty)) {
      failed.push({ index, error: 'difficulty must be easy, medium, or hard' });
      return;
    }

    const duplicateKey = `${candidate.categoryId}:${candidate.questionText.trim().toLowerCase()}`;
    if (seen.has(duplicateKey)) {
      failed.push({ index, error: 'Duplicate question in import file' });
      return;
    }
    seen.add(duplicateKey);

    candidates.push({ index, payload: candidate });
  });

  // Verify duplicates in Firestore database.
  // To avoid running individual queries for each import question, we can load questions in matching categories.
  const targetCategoryIds = [...new Set(candidates.map(c => c.payload.categoryId))];
  const dbQuestions = [];
  for (const catId of targetCategoryIds) {
    const qSnapshot = await db.collection('questions').where('categoryId', '==', catId).get();
    qSnapshot.forEach(doc => {
      dbQuestions.push({
        categoryId: doc.data().categoryId,
        questionText: String(doc.data().questionText || '').trim().toLowerCase()
      });
    });
  }

  const dbDuplicateSet = new Set(dbQuestions.map(q => `${q.categoryId}:${q.questionText}`));

  let imported = 0;
  for (const candidate of candidates) {
    const dupKey = `${candidate.payload.categoryId}:${candidate.payload.questionText.trim().toLowerCase()}`;
    if (dbDuplicateSet.has(dupKey)) {
      failed.push({ index: candidate.index, error: 'Duplicate question already exists in this category' });
      continue;
    }

    // Save to Firestore
    const newDocRef = db.collection('questions').doc();
    const payload = {
      categoryId: candidate.payload.categoryId,
      categoryName: candidate.payload.categoryName,
      questionText: candidate.payload.questionText.trim(),
      choices: candidate.payload.choices.map(c => c.trim()),
      correctAnswerIndex: candidate.payload.correctAnswerIndex,
      explanation: (candidate.payload.explanation || '').trim(),
      difficulty: candidate.payload.difficulty || 'medium',
      source: (candidate.payload.source || '').trim(),
      isActive: candidate.payload.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      legacyMongoId: candidate.payload.legacyMongoId || null
    };
    await newDocRef.set(payload);
    imported++;
  }

  if (imported > 0) {
    const importedCategoryIds = [...new Set(candidates.map(c => c.payload.categoryId))];
    for (const catId of importedCategoryIds) {
      firestoreExamPackService.markPackStale(catId);
    }
  }

  return { imported, failed: failed.length, errors: failed.slice(0, 50) };
}

module.exports = {
  getQuestions,
  getQuestionById,
  getRandomQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions
};
