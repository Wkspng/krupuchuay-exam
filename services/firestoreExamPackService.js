const { db } = require('../src/firebaseAdmin');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

function estimateDocumentSize(data) {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

async function markPackStale(categoryId) {
  if (!categoryId) return;
  try {
    await db.collection('examPackIndexes').doc(categoryId).set({
      isStale: true,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (err) {
    console.error(`Failed to mark category ${categoryId} pack as stale:`, err);
  }
}

async function compileCategoryExamPack(categoryId, options = {}) {
  const { dryRun = false } = options;

  try {
    // Retrieve category info
    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
      throw new Error(`Category ${categoryId} not found`);
    }
    const categoryName = categoryDoc.data().name || 'ไม่ระบุหมวด';

    // Query all active questions in category
    const snapshot = await db.collection('questions')
      .where('categoryId', '==', categoryId)
      .where('isActive', '==', true)
      .get();

    const rawQuestions = [];
    snapshot.forEach(doc => {
      rawQuestions.push({ id: doc.id, ...doc.data() });
    });

    // Sort deterministically by id/documentId
    rawQuestions.sort((a, b) => a.id.localeCompare(b.id));

    // Validation
    const invalidQuestions = [];
    const validQuestions = [];
    
    rawQuestions.forEach((q, idx) => {
      let reason = '';
      if (!q.questionText || !String(q.questionText).trim()) {
        reason = 'questionText is empty';
      } else if (!Array.isArray(q.choices) || q.choices.length !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim())) {
        reason = 'choices does not contain 4 non-empty options';
      } else if (!Number.isInteger(q.correctAnswerIndex) || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
        reason = 'correctAnswerIndex is not between 0 and 3';
      }
      
      if (reason) {
        invalidQuestions.push({ id: q.id, index: idx, reason });
      } else {
        validQuestions.push({
          id: q.id,
          _id: q.id, // Keep _id for legacy client code
          questionText: q.questionText.trim(),
          choices: q.choices.map(c => c.trim()),
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: (q.explanation || '').trim(),
          difficulty: q.difficulty || 'medium',
          topic: q.topic || '',
          source: q.source || '',
          // Optional figure fields (SVG) for image-based questions e.g. อนุกรมภาพ.
          // Only included when present so text-only questions add no bytes.
          ...(q.questionSvg ? { questionSvg: q.questionSvg } : {}),
          ...(Array.isArray(q.choiceSvgs) && q.choiceSvgs.length ? { choiceSvgs: q.choiceSvgs } : {})
        });
      }
    });

    if (invalidQuestions.length > 0 && !dryRun) {
      throw new Error(`Validation failed: Category has ${invalidQuestions.length} invalid questions. Rebuild aborted.`);
    }

    // Get current index to find next version
    const indexDoc = await db.collection('examPackIndexes').doc(categoryId).get();
    let currentVersion = 0;
    if (indexDoc.exists) {
      currentVersion = indexDoc.data().version || 0;
    }
    const nextVersion = currentVersion + 1;

    // Split validQuestions into chunks
    const chunks = [];
    let currentChunkNo = 1;
    let currentQuestions = [];

    for (const q of validQuestions) {
      // Attempt adding to current chunk
      const testQuestions = [...currentQuestions, q];
      const testChunkDoc = {
        categoryId,
        categoryName,
        version: nextVersion,
        chunkNo: currentChunkNo,
        questionCount: testQuestions.length,
        questions: testQuestions,
        approxSizeBytes: 0,
        compiledAt: Timestamp.now()
      };
      
      const size = estimateDocumentSize(testChunkDoc);
      
      // Check if adding exceeds 700 KB or 100 questions limit
      if (size > 700 * 1024 || currentQuestions.length >= 100) {
        if (currentQuestions.length === 0) {
          throw new Error(`A single question is too large to fit in a chunk.`);
        }
        
        const chunkId = `category_${categoryId}_v${nextVersion}_chunk_${String(currentChunkNo).padStart(3, '0')}`;
        chunks.push({
          chunkId,
          chunkNo: currentChunkNo,
          questions: currentQuestions,
          size: estimateDocumentSize({
            categoryId,
            categoryName,
            version: nextVersion,
            chunkNo: currentChunkNo,
            questionCount: currentQuestions.length,
            questions: currentQuestions,
            approxSizeBytes: 0,
            compiledAt: Timestamp.now()
          })
        });
        
        currentChunkNo++;
        currentQuestions = [q];
      } else {
        currentQuestions = testQuestions;
      }
    }

    // Finalize last chunk if not empty
    if (currentQuestions.length > 0) {
      const chunkId = `category_${categoryId}_v${nextVersion}_chunk_${String(currentChunkNo).padStart(3, '0')}`;
      chunks.push({
        chunkId,
        chunkNo: currentChunkNo,
        questions: currentQuestions,
        size: estimateDocumentSize({
          categoryId,
          categoryName,
          version: nextVersion,
          chunkNo: currentChunkNo,
          questionCount: currentQuestions.length,
          questions: currentQuestions,
          approxSizeBytes: 0,
          compiledAt: Timestamp.now()
        })
      });
    }

    // Dry-run reports size info
    if (dryRun) {
      return {
        categoryId,
        categoryName,
        totalQuestions: rawQuestions.length,
        activeQuestions: validQuestions.length,
        estimatedChunkCount: chunks.length,
        estimatedSizeBytes: chunks.reduce((acc, c) => acc + c.size, 0),
        warnings: invalidQuestions.length > 0 ? [`พบข้อสอบที่ไม่ถูกต้อง ${invalidQuestions.length} ข้อ`] : [],
        invalidQuestions: invalidQuestions.map(q => ({ id: q.id, index: q.index, reason: q.reason }))
      };
    }

    // Write chunks to Firestore
    for (const chunk of chunks) {
      const chunkPayload = {
        categoryId,
        categoryName,
        version: nextVersion,
        chunkNo: chunk.chunkNo,
        questionCount: chunk.questions.length,
        questions: chunk.questions,
        approxSizeBytes: chunk.size,
        compiledAt: FieldValue.serverTimestamp()
      };
      await db.collection('examPackChunks').doc(chunk.chunkId).set(chunkPayload);
    }

    // Compile Index doc
    const chunkIds = chunks.map(c => c.chunkId);
    const questionCountByChunk = {};
    const approxSizeBytesByChunk = {};
    chunks.forEach(c => {
      questionCountByChunk[c.chunkId] = c.questions.length;
      approxSizeBytesByChunk[c.chunkId] = c.size;
    });

    const indexPayload = {
      categoryId,
      categoryName,
      version: nextVersion,
      isPublished: true,
      isStale: false,
      lastError: null,
      totalQuestions: validQuestions.length,
      chunkCount: chunks.length,
      chunkIds,
      questionCountByChunk,
      approxSizeBytesByChunk,
      compiledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      sourceQuestionUpdatedAt: FieldValue.serverTimestamp()
    };

    // Write Index to publish
    await db.collection('examPackIndexes').doc(categoryId).set(indexPayload);

    // Clean up old version chunks
    if (indexDoc.exists) {
      const oldChunkIds = indexDoc.data().chunkIds || [];
      for (const oldId of oldChunkIds) {
        try {
          await db.collection('examPackChunks').doc(oldId).delete();
        } catch (err) {
          console.error(`Failed to clean up old chunk ${oldId}:`, err);
        }
      }
    }

    return indexPayload;
  } catch (err) {
    if (!dryRun) {
      try {
        await db.collection('examPackIndexes').doc(categoryId).set({
          lastError: err.message,
          isStale: true,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (writeErr) {
        console.error('Failed to write compile error to index:', writeErr);
      }
    }
    throw err;
  }
}

async function getCategoryPackStatus(categoryId) {
  const categoryDoc = await db.collection('categories').doc(categoryId).get();
  if (!categoryDoc.exists) {
    throw new Error('Category not found');
  }
  const categoryName = categoryDoc.data().name || 'ไม่ระบุหมวด';

  // Count active questions
  const activeQuestionsSnap = await db.collection('questions')
    .where('categoryId', '==', categoryId)
    .where('isActive', '==', true)
    .get();
  const activeQuestionsCount = activeQuestionsSnap.size;

  const indexDoc = await db.collection('examPackIndexes').doc(categoryId).get();
  if (!indexDoc.exists) {
    return {
      categoryId,
      categoryName,
      status: 'missing',
      version: null,
      activeQuestionsCount,
      chunkCount: 0,
      compiledAt: null,
      approxSizeTotal: 0,
      lastError: null
    };
  }

  const indexData = indexDoc.data();
  let status = 'published';
  if (indexData.lastError) {
    status = 'error';
  } else if (indexData.isStale) {
    status = 'stale';
  } else if (!indexData.isPublished) {
    status = 'missing';
  }

  // Calculate approx size total
  let approxSizeTotal = 0;
  if (indexData.approxSizeBytesByChunk) {
    Object.values(indexData.approxSizeBytesByChunk).forEach(size => {
      approxSizeTotal += size;
    });
  }

  return {
    categoryId,
    categoryName,
    status,
    version: indexData.version || null,
    activeQuestionsCount,
    chunkCount: indexData.chunkCount || 0,
    compiledAt: indexData.compiledAt ? (indexData.compiledAt.toDate ? indexData.compiledAt.toDate().toISOString() : indexData.compiledAt) : null,
    approxSizeTotal,
    lastError: indexData.lastError || null
  };
}

async function getPublishedCategoryPack(categoryId) {
  try {
    const doc = await db.collection('examPackIndexes').doc(categoryId).get();
    if (doc.exists && doc.data().isPublished) {
      return doc.data();
    }
  } catch (err) {
    console.error(`Error loading published pack index for category ${categoryId}:`, err);
  }
  return null;
}

async function getRandomQuestionsFromPack(categoryId, limit) {
  try {
    const indexData = await getPublishedCategoryPack(categoryId);
    if (!indexData || indexData.isStale) {
      return null; // fallback
    }

    const chunkIds = indexData.chunkIds || [];
    if (chunkIds.length === 0) {
      return [];
    }

    // Load ALL chunks so every question has an equal chance of being drawn.
    // Previously we stopped after the first chunk(s) that reached `limit`, which
    // meant the earliest chunk was returned almost every time and later chunks
    // rarely appeared — practice kept surfacing the same questions.
    const loadedQuestions = [];
    for (const chunkId of chunkIds) {
      const chunkDoc = await db.collection('examPackChunks').doc(chunkId).get();
      if (chunkDoc.exists) {
        const chunkData = chunkDoc.data();
        if (Array.isArray(chunkData.questions)) {
          loadedQuestions.push(...chunkData.questions);
        }
      }
    }

    // Fisher-Yates shuffle over the full pool, then take `limit`
    for (let i = loadedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [loadedQuestions[i], loadedQuestions[j]] = [loadedQuestions[j], loadedQuestions[i]];
    }

    return loadedQuestions.slice(0, limit);
  } catch (err) {
    console.error(`Error loading random questions from pack for category ${categoryId}:`, err);
    return null; // fallback
  }
}

module.exports = {
  estimateDocumentSize,
  compileCategoryExamPack,
  getCategoryPackStatus,
  getPublishedCategoryPack,
  getRandomQuestionsFromPack,
  markPackStale
};
