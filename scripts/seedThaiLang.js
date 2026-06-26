require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { db } = require('../src/firebaseAdmin');

const CATEGORY_NAME = 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)';
const CATEGORY_ORDER = 7;

function extractThaiLangQuestions() {
  const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  const lines = appJs.split('\n');

  const startIdx = lines.findIndex(l => /^thai_lang:\s*\[/.test(l));
  if (startIdx === -1) throw new Error('thai_lang array not found in public/app.js');

  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^math:\s*\[/.test(lines[i])) { endIdx = i - 1; break; }
  }
  if (endIdx === -1) throw new Error('Could not find end of thai_lang array');

  // lines[endIdx] is "]," — the closing bracket; content is between startIdx+1 and endIdx-1
  const body = lines.slice(startIdx + 1, endIdx).join('\n');
  // eslint-disable-next-line no-new-func
  return new Function(`return [${body}]`)();
}

async function findOrCreateCategory() {
  const snapshot = await db.collection('categories').get();
  let categoryId = null;

  snapshot.forEach(doc => {
    if (String(doc.data().name || '').trim() === CATEGORY_NAME) {
      categoryId = doc.id;
    }
  });

  if (categoryId) {
    console.log(`✅ พบ category อยู่แล้ว: "${CATEGORY_NAME}" (${categoryId})`);
    return categoryId;
  }

  const docRef = db.collection('categories').doc();
  await docRef.set({
    name: CATEGORY_NAME,
    description: 'ข้อสอบวิชาภาษาไทย ชนิดของคำ สำนวน การอ่านจับใจความ และวรรณคดี สำหรับการสอบครูผู้ช่วย ภาค ก.',
    order: CATEGORY_ORDER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    legacyMongoId: 'thai_lang',
  });
  console.log(`✅ สร้าง category ใหม่: "${CATEGORY_NAME}" (${docRef.id})`);
  return docRef.id;
}

async function main() {
  const questions = extractThaiLangQuestions();
  console.log(`📖 อ่านข้อสอบจาก public/app.js ได้ ${questions.length} ข้อ`);

  const categoryId = await findOrCreateCategory();

  // Load existing questions in this category to avoid duplicates
  const existingSnap = await db.collection('questions')
    .where('categoryId', '==', categoryId)
    .get();

  const existingTexts = new Set();
  existingSnap.forEach(doc => {
    existingTexts.add(String(doc.data().questionText || '').trim().toLowerCase());
  });
  console.log(`📦 พบข้อสอบใน Firestore แล้ว ${existingTexts.size} ข้อ (จะข้ามถ้าซ้ำ)`);

  // Batch write (Firestore batch max 500 ops)
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchOps = 0;
  let imported = 0;
  let skipped = 0;

  for (const q of questions) {
    const questionText = String(q.q || '').trim();
    if (!questionText) { skipped++; continue; }

    if (existingTexts.has(questionText.toLowerCase())) {
      skipped++;
      continue;
    }

    const docRef = db.collection('questions').doc();
    batch.set(docRef, {
      categoryId,
      categoryName: CATEGORY_NAME,
      questionText,
      choices: (q.opts || []).map(o => String(o).trim()),
      correctAnswerIndex: q.ans,
      explanation: String(q.explain || '').trim(),
      difficulty: 'medium',
      source: [q.topic, q.year ? `ปี ${q.year}` : ''].filter(Boolean).join(' — '),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      legacyMongoId: null,
    });

    imported++;
    batchOps++;

    if (batchOps >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
      console.log(`  committed batch of ${BATCH_SIZE}…`);
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log(`\n✅ เสร็จสิ้น: import ${imported} ข้อ | ข้ามซ้ำ ${skipped} ข้อ`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed ล้มเหลว:', err.message);
  process.exit(1);
});
