const mongoose = require('mongoose');
const Category = require('../models/Category');

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function sendModelError(res, error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(error.errors)[0].message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'A category with this name already exists' });
  }
  return res.status(500).json({ error: 'Unable to process category request' });
}

async function getCategories(req, res) {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const filter = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });
    return res.json(categories);
  } catch (error) {
    return sendModelError(res, error);
  }
}

async function createCategory(req, res) {
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

async function updateCategory(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

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

async function deleteCategory(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    return res.json({ success: true });
  } catch (error) {
    return sendModelError(res, error);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
