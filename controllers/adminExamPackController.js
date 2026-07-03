const { db } = require('../src/firebaseAdmin');
const firestoreExamPackService = require('../services/firestoreExamPackService');

async function getExamPacksStatus(req, res) {
  try {
    const categoriesSnap = await db.collection('categories').get();
    const statuses = [];
    for (const doc of categoriesSnap.docs) {
      const statusObj = await firestoreExamPackService.getCategoryPackStatus(doc.id);
      statuses.push(statusObj);
    }
    return res.json(statuses);
  } catch (error) {
    console.error('getExamPacksStatus error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getSingleExamPackStatus(req, res) {
  try {
    const { categoryId } = req.params;
    const statusObj = await firestoreExamPackService.getCategoryPackStatus(categoryId);
    return res.json(statusObj);
  } catch (error) {
    console.error('getSingleExamPackStatus error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function dryRunExamPack(req, res) {
  try {
    const { categoryId } = req.params;
    const result = await firestoreExamPackService.compileCategoryExamPack(categoryId, { dryRun: true });
    return res.json(result);
  } catch (error) {
    console.error('dryRunExamPack error:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function compileExamPack(req, res) {
  try {
    const { categoryId } = req.params;
    const result = await firestoreExamPackService.compileCategoryExamPack(categoryId, { dryRun: false });
    
    return res.json({
      categoryId: result.categoryId,
      categoryName: result.categoryName,
      version: result.version,
      totalQuestions: result.totalQuestions,
      chunkCount: result.chunkCount,
      approxSizeBytesByChunk: result.approxSizeBytesByChunk,
      compiledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('compileExamPack error:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function compileAllExamPacks(req, res) {
  try {
    const categoriesSnap = await db.collection('categories').get();
    const results = [];
    const errors = [];

    for (const doc of categoriesSnap.docs) {
      try {
        const result = await firestoreExamPackService.compileCategoryExamPack(doc.id, { dryRun: false });
        results.push({
          categoryId: doc.id,
          categoryName: doc.data().name || 'ไม่ระบุหมวด',
          version: result.version,
          totalQuestions: result.totalQuestions,
          chunkCount: result.chunkCount,
          status: 'success'
        });
      } catch (err) {
        console.error(`Failed to compile category ${doc.id}:`, err);
        errors.push({
          categoryId: doc.id,
          categoryName: doc.data().name || 'ไม่ระบุหมวด',
          error: err.message
        });
      }
    }

    return res.json({
      compiledCount: results.length,
      failedCount: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('compileAllExamPacks error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getExamPacksStatus,
  getSingleExamPackStatus,
  dryRunExamPack,
  compileExamPack,
  compileAllExamPacks
};
