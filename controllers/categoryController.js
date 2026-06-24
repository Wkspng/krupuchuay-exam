const firestoreCategoryService = require('../services/firestoreCategoryService');

function isValidId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

function sendModelError(res, error) {
  if (error.name === 'ValidationError' || String(error.message).startsWith('ValidationError')) {
    const msg = error.errors ? Object.values(error.errors)[0].message : error.message.replace('ValidationError: ', '');
    return res.status(400).json({ error: msg });
  }
  if (error.code === 'ALREADY_EXISTS') {
    return res.status(409).json({ error: 'A category with this name already exists' });
  }
  return res.status(500).json({ error: 'Unable to process category request' });
}

async function getCategories(req, res) {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const categories = await firestoreCategoryService.getCategories(includeInactive);
    return res.json(categories);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function createCategory(req, res) {
  try {
    const category = await firestoreCategoryService.createCategory(req.body);
    return res.status(201).json(category);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function updateCategory(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const category = await firestoreCategoryService.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    return res.json(category);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function deleteCategory(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const result = await firestoreCategoryService.deleteCategory(req.params.id);
    if (!result) return res.status(404).json({ error: 'Category not found' });
    return res.json({ success: true });
  } catch (error) {
    return sendModelError(res, error);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
