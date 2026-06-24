/**
 * Recursively maps Firestore fields, converting Timestamp objects to ISO strings.
 */
function serializeValue(val) {
  if (!val) return val;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(serializeValue);
  }
  if (typeof val === 'object') {
    const res = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        res[key] = serializeValue(val[key]);
      }
    }
    return res;
  }
  return val;
}

/**
 * Maps a single Firestore document snapshot to a plain JS object.
 */
function mapDoc(doc) {
  if (!doc) return null;
  if (!doc.exists) return null;
  const data = doc.data();
  const id = doc.id;
  const serialized = serializeValue(data);
  return {
    ...serialized,
    id,
    _id: id,
  };
}

module.exports = { mapDoc, serializeValue };
