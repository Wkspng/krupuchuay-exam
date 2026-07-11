const fs = require('fs');
const path = require('path');
const { db } = require('../src/firebaseAdmin');

// Extract PRACTICE_EXAM_STRUCTURE straight from public/app.js so the topic /
// keyword definitions stay in ONE place (the frontend) — no duplicated map to
// drift out of sync.
function extractStructure() {
  const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  const lines = appJs.split('\n');

  const start = lines.findIndex(l => /const PRACTICE_EXAM_STRUCTURE\s*=\s*\[/.test(l));
  if (start === -1) throw new Error('PRACTICE_EXAM_STRUCTURE not found in public/app.js');

  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\];/.test(lines[i])) { end = i; break; }
  }
  if (end === -1) throw new Error('End of PRACTICE_EXAM_STRUCTURE not found');

  const body = lines.slice(start + 1, end).join('\n');
  // eslint-disable-next-line no-new-func
  return new Function(`return [${body}]`)();
}

function normalize(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Mirrors the client-side matching used in startPracticeQuiz / updatePracticeCounts.
function countMatches(questions, keywords, title) {
  const nt = normalize(title);
  const kws = (keywords || []).map(normalize).filter(Boolean);
  let c = 0;
  for (const q of questions) {
    const content = [q.topic, q.categoryName, q.questionText, q.explanation, q.source]
      .map(normalize)
      .join(' ');
    if (nt && content.includes(nt)) { c++; continue; }
    if (kws.some(k => content.includes(k))) c++;
  }
  return c;
}

// Read all referenced categories' active questions ONCE, compute per-topic
// counts, and store them in a single tiny document. This runs admin-side
// (during exam-pack recompile or via npm run counts:refresh), NOT per user.
async function computeAndStoreCounts() {
  const structure = extractStructure();

  // Every category name referenced anywhere in the structure
  const names = new Set();
  structure.forEach(m => {
    (m.categoryNames || []).forEach(n => names.add(n));
    (m.subSubjects || []).forEach(s => {
      (s.categoryNames || []).forEach(n => names.add(n));
      (s.topics || []).forEach(t => (t.categoryNames || []).forEach(n => names.add(n)));
    });
  });

  // Resolve category name -> id
  const catSnap = await db.collection('categories').get();
  const nameToId = new Map();
  catSnap.forEach(d => nameToId.set(normalize(d.data().name), d.id));

  // Fetch each referenced category's active questions once
  const byName = {};
  for (const name of names) {
    const norm = normalize(name);
    const id = nameToId.get(norm);
    if (!id) { byName[norm] = []; continue; }
    const qs = await db.collection('questions')
      .where('categoryId', '==', id)
      .where('isActive', '==', true)
      .get();
    byName[norm] = qs.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  const questionsForCats = (catNames) => {
    const seen = new Set();
    const out = [];
    (catNames || []).forEach(n => {
      (byName[normalize(n)] || []).forEach(q => {
        if (seen.has(q.id)) return;
        seen.add(q.id);
        out.push(q);
      });
    });
    return out;
  };

  // Key counts by the same composite id the frontend badge element uses
  const counts = {};
  structure.forEach(m => {
    (m.subSubjects || []).forEach(s => {
      (s.topics || []).forEach(t => {
        const pool = questionsForCats(t.categoryNames || s.categoryNames);
        counts[`${m.id}-${s.id}-${t.id}`] = countMatches(pool, t.keywords, t.title);
      });
    });
  });

  await db.collection('appConfig').doc('practiceTopicCounts').set({
    counts,
    updatedAt: new Date(),
  });

  return { topics: Object.keys(counts).length, counts };
}

async function getStoredCounts() {
  const doc = await db.collection('appConfig').doc('practiceTopicCounts').get();
  if (!doc.exists) return { counts: {}, updatedAt: null };
  const d = doc.data();
  const updatedAt = d.updatedAt
    ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt)
    : null;
  return { counts: d.counts || {}, updatedAt };
}

module.exports = { computeAndStoreCounts, getStoredCounts, extractStructure };
