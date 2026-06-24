const firestoreExamSetService = require('../services/firestoreExamSetService');

function isValidId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

function modelError(res, error) {
  if (error.name === 'ValidationError' || String(error.message).startsWith('ValidationError')) {
    const msg = error.errors ? Object.values(error.errors)[0].message : error.message.replace('ValidationError: ', '');
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: 'Unable to process exam set request' });
}

async function getExamSets(req, res) {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const sets = await firestoreExamSetService.getExamSets(includeInactive);
    return res.json(sets);
  } catch (error) {
    return modelError(res, error);
  }
}

async function getExamSetById(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });

  try {
    const set = await firestoreExamSetService.getExamSetById(req.params.id);
    if (!set || (!set.isActive && req.user?.role !== 'admin')) {
      return res.status(404).json({ error: 'ไม่พบชุดข้อสอบที่เปิดใช้งาน' });
    }
    return res.json(set);
  } catch (error) {
    return modelError(res, error);
  }
}

async function createExamSet(req, res) {
  try {
    const set = await firestoreExamSetService.createExamSet(req.body, req.user.sub);
    return res.status(201).json(set);
  } catch (error) {
    if (error.message.startsWith('กรุณา') || error.message.includes('สัดส่วน') || error.message.includes('จำนวน')) {
      return res.status(400).json({ error: error.message });
    }
    return modelError(res, error);
  }
}

async function updateExamSet(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });

  try {
    const set = await firestoreExamSetService.updateExamSet(req.params.id, req.body);
    if (!set) return res.status(404).json({ error: 'Exam set not found' });
    return res.json(set);
  } catch (error) {
    if (error.message.startsWith('กรุณา') || error.message.includes('สัดส่วน') || error.message.includes('จำนวน')) {
      return res.status(400).json({ error: error.message });
    }
    return modelError(res, error);
  }
}

async function deleteExamSet(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });

  try {
    const result = await firestoreExamSetService.deleteExamSet(req.params.id);
    if (!result) return res.status(404).json({ error: 'Exam set not found' });
    return res.json({ success: true, message: 'ปิดใช้งานชุดข้อสอบแล้ว' });
  } catch (error) {
    return modelError(res, error);
  }
}

async function startExamSet(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid exam set id' });

  try {
    const sessionData = await firestoreExamSetService.startExamSet(req.params.id);
    if (!sessionData) {
      return res.status(404).json({ error: 'ไม่พบชุดข้อสอบที่เปิดใช้งาน' });
    }
    return res.json(sessionData);
  } catch (error) {
    if (error.code === 'INSUFFICIENT_QUESTIONS') {
      return res.status(409).json({
        error: error.message,
        categoryId: error.categoryId,
        required: error.required,
        available: error.available
      });
    }
    return modelError(res, error);
  }
}

module.exports = { getExamSets, getExamSetById, createExamSet, updateExamSet, deleteExamSet, startExamSet };
