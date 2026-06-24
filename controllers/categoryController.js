const mongoose = require('mongoose');
const Category = require('../models/Category');
const firestoreCategoryService = require('../services/firestoreCategoryService');

const dataSource = process.env.DATA_SOURCE || 'firestore';

function isValidId(id) {
  // Firestore ID has a different format, but we can allow standard validations
  if (dataSource === 'mongo') {
    return mongoose.isValidObjectId(id);
  }
  // Firestore generated IDs are typical alphanumeric strings of length 20
  return typeof id === 'string' && id.trim().length > 0;
}

function sendModelError(res, error) {
  if (error.name === 'ValidationError' || String(error.message).startsWith('ValidationError')) {
    const msg = error.errors ? Object.values(error.errors)[0].message : error.message.replace('ValidationError: ', '');
    return res.status(400).json({ error: msg });
  }
  if (error.code === 11000 || error.code === 'ALREADY_EXISTS') {
    return res.status(409).json({ error: 'A category with this name already exists' });
  }
  return res.status(500).json({ error: 'Unable to process category request' });
}

async function getCategories(req, res) {
  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    try {
      const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
      const filter = includeInactive ? {} : { isActive: true };
      const categories = await Category.find(filter).sort({ order: 1, name: 1 });
      return res.json(categories);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const categories = await firestoreCategoryService.getCategories(includeInactive);
    return res.json(categories);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function createCategory(req, res) {
  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    try {
      const category = await Category.create({
        name: req.body.name,
        description: req.body.description || '',
        order: req.body.order ?? 0,
        isActive: req.body.isActive ?? true,
      });
      return res.status(201).json(category);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
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

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    const updates = {};
    ['name', 'description', 'order', 'isActive'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
      if (!category) return res.status(404).json({ error: 'Category not found' });
      return res.json(category);
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
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

  if (dataSource === 'mongo') {
    /* LEGACY MONGO COMPATIBILITY LAYER - WILL BE REMOVED IN PHASE 4 */
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      return res.json({ success: true });
    } catch (error) {
      return sendModelError(res, error);
    }
  }

  /* FIRESTORE PRIMARY PATH */
  try {
    const result = await firestoreCategoryService.deleteCategory(req.params.id);
    if (!result) return res.status(404).json({ error: 'Category not found' });
    return res.json({ success: true });
  } catch (error) {
    return sendModelError(res, error);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
