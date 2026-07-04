/**
 * Import remaining mapped hardcoded question banks (math and ethics) to Firestore.
 *
 * Usage:
 *   node scripts/importMappedHardcodedQuestionBanks.js --dry-run
 *   node scripts/importMappedHardcodedQuestionBanks.js --apply
 *
 * Defaults:
 *   Processes 'math' and 'ethics' keys.
 */

const { db } = require('../src/firebaseAdmin');
const { parseAllQuestionBanks } = require('./utils/parseHardcodedQuestionBanks');

const IMPORT_CONFIGS = {
  math: {
    categoryId: '6a39436fc2e97ab3a084bc03',
    categoryName: 'ความสามารถทั่วไป',
    source: 'hardcoded_QB_math_import'
  },
  ethics: {
    categoryId: '6a39437ac2e97ab3a084bc16',
    categoryName: 'วิชาชีพครู',
    source: 'hardcoded_QB_ethics_import'
  }
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');
const force = args.includes('--force');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/importMappedHardcodedQuestionBanks.js --dry-run');
  console.log('  node scripts/importMappedHardcodedQuestionBanks.js --apply');
  process.exit(1);
}

// Map difficulty text
function mapDifficulty(diff) {
  if (!diff) return 'medium';
  const clean = String(diff).trim().toLowerCase();
  if (clean === 'พื้นฐาน' || clean === 'easy') return 'easy';
  if (clean === 'ปานกลาง' || clean === 'medium') return 'medium';
  if (clean === 'ยาก' || clean === 'hard') return 'hard';
  return 'medium';
}

async function processKey(key, qbData) {
  const config = IMPORT_CONFIGS[key];
  if (!config) {
    console.log(`[${key.toUpperCase()}] No configuration found, skipping.`);
    return;
  }

  const { categoryId, categoryName, source } = config;
  const rawQs = qbData.questions || [];
  console.log(`\n========================================`);
  console.log(`Processing key: QB.${key}`);
  console.log(`Target Category: "${categoryName}" (${categoryId})`);
  console.log(`Questions found: ${rawQs.length}`);
  console.log(`========================================`);

  // 1. Verify category exists
  const catDoc = await db.collection('categories').doc(categoryId).get();
  if (!catDoc.exists) {
    console.error(`❌ Category ID "${categoryId}" not found in Firestore!`);
    return;
  }
  console.log(`  ✅ Category verified: "${catDoc.data().name}"`);

  // 2. Count active questions in Firestore before
  const fsActiveSnap = await db.collection('questions')
    .where('categoryId', '==', categoryId)
    .where('isActive', '==', true)
    .get();
  const fsActiveBefore = fsActiveSnap.size;
  console.log(`  Firestore active count before import: ${fsActiveBefore}`);

  // 3. Prevent duplicate imports
  const existingSnap = await db.collection('questions')
    .where('categoryId', '==', categoryId)
    .where('source', '==', source)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    console.warn(`  ⚠️  Found existing questions imported with source="${source}"`);
    if (!force) {
      console.error(`  ❌ Aborting import for QB.${key} to prevent duplicates. (Use --force to override)`);
      return;
    }
    console.log(`  ⚠️  --force enabled, proceeding with import.`);
  }

  // 4. Validate & parse
  const validQuestions = [];
  const errors = [];
  const seenKeys = new Set();

  rawQs.forEach((q, i) => {
    const idx = i + 1;
    if (!q.q || typeof q.q !== 'string' || !q.q.trim()) {
      errors.push(`#${idx}: questionText (q) is missing or empty`);
      return;
    }
    if (!Array.isArray(q.opts) || q.opts.length !== 4) {
      errors.push(`#${idx}: choices (opts) must have exactly 4 items`);
      return;
    }
    if (q.opts.some(o => typeof o !== 'string' || !o.trim())) {
      errors.push(`#${idx}: one or more choices are empty or not strings`);
      return;
    }
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) {
      errors.push(`#${idx}: correctAnswerIndex (ans) must be 0-3`);
      return;
    }

    const textKey = (q.q.trim() + '||' + q.opts[0].trim()).toLowerCase();
    if (seenKeys.has(textKey)) {
      errors.push(`#${idx}: Duplicate question in batch`);
      return;
    }
    seenKeys.add(textKey);

    validQuestions.push({
      questionText: q.q.trim(),
      choices: q.opts.map(o => o.trim()),
      correctAnswerIndex: q.ans,
      explanation: (q.explain || '').trim(),
      difficulty: mapDifficulty(q.difficulty),
      topic: (q.topic || '').trim()
    });
  });

  if (errors.length > 0) {
    console.error(`  ❌ Validation failed with ${errors.length} errors:`);
    errors.forEach(e => console.error(`     - ${e}`));
    process.exit(1);
  }
  console.log(`  ✅ All ${validQuestions.length} questions validated successfully.`);

  const now = new Date();
  const importBatch = `${key}_import_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;

  console.log(`  Import batch tag: ${importBatch}`);
  console.log(`  Expected active count after: ${fsActiveBefore + validQuestions.length}`);

  if (dryRun) {
    console.log(`  [DRY-RUN] No writes performed.`);
    return;
  }

  // 5. Apply writes
  const BATCH_SIZE = 400;
  let imported = 0;

  for (let i = 0; i < validQuestions.length; i += BATCH_SIZE) {
    const chunk = validQuestions.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach(q => {
      const docRef = db.collection('questions').doc();
      batch.set(docRef, {
        categoryId,
        categoryName,
        questionText: q.questionText,
        choices: q.choices,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        source,
        importBatch,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        legacyMongoId: null
      });
    });

    await batch.commit();
    imported += chunk.length;
    console.log(`  ✅ Written batch: ${imported}/${validQuestions.length}`);
  }

  console.log(`  ✅ Successfully imported ${imported} questions.`);

  // 6. Mark pack as stale
  try {
    const indexRef = db.collection('examPackIndexes').doc(categoryId);
    const indexDoc = await indexRef.get();
    if (indexDoc.exists) {
      await indexRef.update({ isStale: true, updatedAt: now });
      console.log(`  ✅ Exam pack for "${categoryName}" marked as stale (needs recompile).`);
    }
  } catch (e) {
    console.warn(`  ⚠️ Could not mark pack as stale: ${e.message}`);
  }
}

async function main() {
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`\n=== IMPORT HARDCODED BANKS: MATH AND ETHICS (${mode}) ===`);

  const qbDataMap = parseAllQuestionBanks();

  // Validate math and ethics exist in raw parsed data
  if (!qbDataMap.math) {
    console.error('❌ math QB key not found in parsed data!');
    process.exit(1);
  }
  if (!qbDataMap.ethics) {
    console.error('❌ ethics QB key not found in parsed data!');
    process.exit(1);
  }

  await processKey('math', qbDataMap.math);
  await processKey('ethics', qbDataMap.ethics);

  console.log(`\n=== PROCESS COMPLETE ===\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
