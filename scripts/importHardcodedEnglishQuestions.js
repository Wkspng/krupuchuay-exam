/**
 * Import hardcoded English (QB.eng_basic) questions from public/app.js into Firestore.
 *
 * Usage:
 *   node scripts/importHardcodedEnglishQuestions.js --dry-run
 *   node scripts/importHardcodedEnglishQuestions.js --apply
 *
 * Safety:
 *   - dry-run: validates and previews, writes NOTHING to Firestore
 *   - apply: writes questions to Firestore after validation
 *   - Prevents duplicate import via source tag check
 *   - Does NOT delete existing data or the hardcoded array
 */

const fs = require('fs');
const path = require('path');
const { db, admin } = require('../src/firebaseAdmin');

const CATEGORY_NAME = 'ภาษาอังกฤษพื้นฐาน';
const SOURCE_TAG = 'hardcoded_QB_eng_basic_import';

// --- CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');
const force = args.includes('--force');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/importHardcodedEnglishQuestions.js --dry-run');
  console.log('  node scripts/importHardcodedEnglishQuestions.js --apply');
  process.exit(1);
}

// --- Extract QB.eng_basic from app.js ---
function extractEngBasicQuestions() {
  const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
  const content = fs.readFileSync(appJsPath, 'utf-8');

  // Find 'eng_basic: [' and extract until the closing '],'
  const startMarker = 'eng_basic: [';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('Cannot find "eng_basic: [" in public/app.js');
  }

  // Find the matching closing bracket
  const arrayStart = startIdx + startMarker.length - 1; // points to '['
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error('Cannot find matching "]" for eng_basic array');
  }

  const arrayStr = content.substring(arrayStart, arrayEnd + 1);

  // Parse as JSON - the array uses double-quoted keys so it should be valid JSON
  // But some entries may use single quotes - normalize first
  let jsonStr = arrayStr;
  // Replace JavaScript-style keys (unquoted) with quoted keys if needed
  // The eng_basic array uses {"q":..., "opts":..., "ans":..., "explain":...} format
  // which is already valid JSON

  let questions;
  try {
    questions = JSON.parse(jsonStr);
  } catch (e) {
    // If direct parse fails, try eval (safe since we control the source)
    try {
      questions = eval(jsonStr);
    } catch (e2) {
      throw new Error(`Failed to parse eng_basic array: ${e.message}`);
    }
  }

  return questions;
}

// --- Validate questions ---
function validateQuestions(questions) {
  const errors = [];
  const seenTexts = new Set();

  questions.forEach((q, i) => {
    const idx = i + 1;

    // questionText (q)
    if (!q.q || typeof q.q !== 'string' || !q.q.trim()) {
      errors.push(`#${idx}: questionText (q) is empty or missing`);
    }

    // choices (opts)
    if (!Array.isArray(q.opts) || q.opts.length !== 4) {
      errors.push(`#${idx}: choices (opts) must be an array of exactly 4 items, got ${Array.isArray(q.opts) ? q.opts.length : typeof q.opts}`);
    } else {
      q.opts.forEach((opt, oi) => {
        if (typeof opt !== 'string' || !opt.trim()) {
          errors.push(`#${idx}: choice[${oi}] is empty or not a string`);
        }
      });
    }

    // correctAnswerIndex (ans)
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) {
      errors.push(`#${idx}: correctAnswerIndex (ans) must be 0-3, got ${q.ans}`);
    }

    // explanation (explain) - optional, but should be a string
    if (q.explain !== undefined && typeof q.explain !== 'string') {
      errors.push(`#${idx}: explanation (explain) should be a string`);
    }

    // difficulty - optional
    if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty)) {
      errors.push(`#${idx}: difficulty must be easy/medium/hard, got "${q.difficulty}"`);
    }

    // Duplicate check (use q + first choice as composite key since some questions share the same prompt)
    const textKey = ((q.q || '').trim() + '||' + ((q.opts && q.opts[0]) || '').trim()).toLowerCase();
    if (seenTexts.has(textKey)) {
      errors.push(`#${idx}: duplicate questionText+choice[0] in batch`);
    }
    seenTexts.add(textKey);
  });

  return errors;
}

// --- Main ---
async function main() {
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`\n=== IMPORT HARDCODED ENGLISH QUESTIONS (${mode}) ===\n`);

  // 1. Verify canonical category
  console.log('--- Step 1: Verifying canonical category ---');
  const categoriesSnap = await db.collection('categories')
    .where('name', '==', CATEGORY_NAME)
    .get();

  if (categoriesSnap.empty) {
    console.error(`❌ Category "${CATEGORY_NAME}" not found in Firestore!`);
    process.exit(1);
  }

  let categoryDoc = null;
  categoriesSnap.forEach(doc => {
    categoryDoc = { id: doc.id, ...doc.data() };
  });

  console.log(`  ✅ Category found:`);
  console.log(`     ID: ${categoryDoc.id}`);
  console.log(`     Name: ${categoryDoc.name}`);
  console.log(`     isActive: ${categoryDoc.isActive}`);

  const CATEGORY_ID = categoryDoc.id;

  // 2. Extract questions from app.js
  console.log('\n--- Step 2: Extracting QB.eng_basic from public/app.js ---');
  let questions;
  try {
    questions = extractEngBasicQuestions();
    console.log(`  ✅ Extracted ${questions.length} questions`);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    process.exit(1);
  }

  // 3. Validate
  console.log('\n--- Step 3: Validating questions ---');
  const errors = validateQuestions(questions);
  if (errors.length > 0) {
    console.error(`  ❌ Validation failed with ${errors.length} errors:`);
    errors.forEach(e => console.error(`     - ${e}`));
    process.exit(1);
  }
  console.log(`  ✅ All ${questions.length} questions passed validation`);

  // Count by difficulty
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  questions.forEach(q => {
    const d = q.difficulty || 'medium';
    diffCounts[d] = (diffCounts[d] || 0) + 1;
  });
  console.log(`     Easy: ${diffCounts.easy}, Medium: ${diffCounts.medium}, Hard: ${diffCounts.hard}`);

  // Count by topic
  const topicCounts = {};
  questions.forEach(q => {
    const t = q.topic || 'Unknown';
    topicCounts[t] = (topicCounts[t] || 0) + 1;
  });
  console.log(`     Topics: ${Object.keys(topicCounts).length}`);
  Object.entries(topicCounts).forEach(([topic, count]) => {
    console.log(`       - ${topic}: ${count} ข้อ`);
  });

  // 4. Check for existing import
  console.log('\n--- Step 4: Checking for previous imports ---');
  const existingSnap = await db.collection('questions')
    .where('categoryId', '==', CATEGORY_ID)
    .where('source', '==', SOURCE_TAG)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    console.log(`  ⚠️ Found existing imported questions with source="${SOURCE_TAG}"`);
    if (!force) {
      console.log(`  ❌ Aborting to prevent duplicate import. Use --force to override.`);
      process.exit(1);
    }
    console.log(`  ⚠️ --force flag detected, proceeding anyway...`);
  } else {
    console.log(`  ✅ No previous import found`);
  }

  // 5. Summary
  const now = new Date();
  const importBatch = `eng_basic_import_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;

  console.log('\n--- Summary ---');
  console.log(`  Category: ${CATEGORY_NAME} (${CATEGORY_ID})`);
  console.log(`  Questions to import: ${questions.length}`);
  console.log(`  Source tag: ${SOURCE_TAG}`);
  console.log(`  Import batch: ${importBatch}`);
  console.log(`  isActive: true (all)`);

  if (dryRun) {
    console.log('\n✅ DRY-RUN COMPLETE. No data was written.');
    console.log('To import, run with --apply flag.');
    process.exit(0);
  }

  // 6. Import (APPLY mode)
  console.log('\n--- Step 5: Importing to Firestore ---');
  const BATCH_SIZE = 400; // Firestore batch limit is 500
  let imported = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const chunk = questions.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach(q => {
      const docRef = db.collection('questions').doc();
      batch.set(docRef, {
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        questionText: String(q.q).trim(),
        choices: q.opts.map(o => String(o).trim()),
        correctAnswerIndex: q.ans,
        explanation: (q.explain || '').trim(),
        difficulty: q.difficulty || 'medium',
        topic: (q.topic || '').trim(),
        source: SOURCE_TAG,
        importBatch: importBatch,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        legacyMongoId: null
      });
    });

    await batch.commit();
    imported += chunk.length;
    console.log(`  ✅ Batch committed: ${imported}/${questions.length}`);
  }

  console.log(`\n✅ IMPORT COMPLETE: ${imported} questions imported to Firestore`);
  console.log(`   Category: ${CATEGORY_NAME} (${CATEGORY_ID})`);
  console.log(`   Source: ${SOURCE_TAG}`);
  console.log(`   Import Batch: ${importBatch}`);

  // 7. Mark exam pack as stale
  try {
    const indexRef = db.collection('examPackIndexes').doc(CATEGORY_ID);
    const indexDoc = await indexRef.get();
    if (indexDoc.exists) {
      await indexRef.update({ isStale: true, updatedAt: now });
      console.log(`   ✅ Exam pack marked as stale (needs recompile)`);
    }
  } catch (e) {
    console.log(`   ⚠️ Could not mark exam pack as stale: ${e.message}`);
  }

  console.log('\n📌 Next step: compile exam pack for this category:');
  console.log(`   node scripts/compileExamPacks.js --apply --categoryId ${CATEGORY_ID}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
