const { db } = require('../src/firebaseAdmin');
const { mapDoc } = require('./firestoreHelper');

async function getCategories(includeInactive = false) {
  let query = db.collection('categories');
  if (!includeInactive) {
    query = query.where('isActive', '==', true);
  }
  const snapshot = await query.get();
  const categories = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) categories.push(mapped);
  });

  // In-memory sort: order ASC, name ASC
  categories.sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const nameA = String(a.name || '').toLowerCase();
    const nameB = String(b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Fetch pre-aggregated totalQuestions from examPackIndexes to avoid querying all questions
  try {
    const packsSnapshot = await db.collection('examPackIndexes').get();
    const packMap = {};
    packsSnapshot.forEach(doc => {
      packMap[doc.id] = doc.data();
    });

    categories.forEach(cat => {
      const pack = packMap[cat.id];
      cat.totalQuestions = pack ? (pack.totalQuestions || 0) : 0;
      cat.activeQuestionsCount = pack ? (pack.totalQuestions || 0) : 0;
      cat.packVersion = pack ? (pack.version || null) : null;
      cat.chunkCount = pack ? (pack.chunkCount || 0) : 0;
      cat.isPublished = pack ? (pack.isPublished || false) : false;
      cat.isStale = pack ? (pack.isStale || false) : false;
      cat.compiledAt = pack ? (pack.compiledAt ? (pack.compiledAt.toDate ? pack.compiledAt.toDate().toISOString() : pack.compiledAt) : null) : null;
    });
  } catch (err) {
    console.error('Failed to attach totalQuestions to categories:', err);
  }

  return categories;
}

async function getCategoryById(id) {
  if (!id) return null;
  const doc = await db.collection('categories').doc(id).get();
  return mapDoc(doc);
}

async function createCategory(data) {
  if (!data.name || !String(data.name).trim()) {
    throw new Error('ValidationError: name is required');
  }
  const trimmedName = String(data.name).trim();

  // Case-insensitive duplicate name check
  const existingSnapshot = await db.collection('categories').get();
  let duplicate = false;
  existingSnapshot.forEach(doc => {
    if (String(doc.data().name || '').trim().toLowerCase() === trimmedName.toLowerCase()) {
      duplicate = true;
    }
  });
  if (duplicate) {
    const err = new Error('A category with this name already exists');
    err.code = 11000;
    throw err;
  }

  const newDocRef = db.collection('categories').doc();
  const categoryPayload = {
    name: trimmedName,
    description: (data.description || '').trim(),
    order: Number.isInteger(data.order) ? data.order : (Number(data.order) || 0),
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    legacyMongoId: data.legacyMongoId || null
  };

  await newDocRef.set(categoryPayload);
  const createdDoc = await newDocRef.get();
  return mapDoc(createdDoc);
}

async function updateCategory(id, data) {
  if (!id) throw new Error('Category ID is required');
  const docRef = db.collection('categories').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }

  const existingData = doc.data();
  const updates = {};
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw new Error('ValidationError: name cannot be empty');
    }
    const trimmedName = data.name.trim();
    if (trimmedName.toLowerCase() !== String(existingData.name || '').toLowerCase()) {
      // Case-insensitive duplicate name check
      const existingSnapshot = await db.collection('categories').get();
      let duplicate = false;
      existingSnapshot.forEach(d => {
        if (d.id !== id && String(d.data().name || '').trim().toLowerCase() === trimmedName.toLowerCase()) {
          duplicate = true;
        }
      });
      if (duplicate) {
        const err = new Error('A category with this name already exists');
        err.code = 11000;
        throw err;
      }
    }
    updates.name = trimmedName;
  }

  if (data.description !== undefined) {
    updates.description = String(data.description).trim();
  }
  if (data.order !== undefined) {
    updates.order = Number.isInteger(data.order) ? data.order : (Number(data.order) || 0);
  }
  if (data.isActive !== undefined) {
    updates.isActive = Boolean(data.isActive);
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await docRef.update(updates);
  }

  const updatedDoc = await docRef.get();
  return mapDoc(updatedDoc);
}

async function deleteCategory(id) {
  if (!id) throw new Error('Category ID is required');
  const docRef = db.collection('categories').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }

  // Soft delete Category
  await docRef.update({
    isActive: false,
    updatedAt: new Date()
  });

  return { success: true };
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
