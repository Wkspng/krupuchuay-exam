/**
 * Import remaining hardcoded question banks (edu_acts, civil_servant, kharachkan) to Firestore.
 *
 * Usage:
 *   node scripts/importRemainingHardcodedQuestionBanks.js --dry-run
 *   node scripts/importRemainingHardcodedQuestionBanks.js --apply
 */

const { db } = require('../src/firebaseAdmin');
const { parseAllQuestionBanks } = require('./utils/parseHardcodedQuestionBanks');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');
const force = args.includes('--force');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/importRemainingHardcodedQuestionBanks.js --dry-run');
  console.log('  node scripts/importRemainingHardcodedQuestionBanks.js --apply');
  process.exit(1);
}

const NEW_CATEGORY_NAME = 'ความรู้และลักษณะการเป็นข้าราชการที่ดี';
const EXISTING_LAW_CAT_ID = '6a394374c2e97ab3a084bc0f';

// Map difficulty text
function mapDifficulty(diff) {
  if (!diff) return 'medium';
  const clean = String(diff).trim().toLowerCase();
  if (clean === 'พื้นฐาน' || clean === 'easy') return 'easy';
  if (clean === 'ปานกลาง' || clean === 'medium') return 'medium';
  if (clean === 'ยาก' || clean === 'hard') return 'hard';
  return 'medium';
}

// Basic validation for questions array
function validateQuestionsList(key, rawQs) {
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

  return { validQuestions, errors };
}

async function main() {
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`\n=== IMPORT REMAINING HARDCODED QUESTION BANKS (${mode}) ===\n`);

  // 1. Parse raw question banks
  const qbDataMap = parseAllQuestionBanks();
  const qbKeys = ['edu_acts', 'civil_servant', 'kharachkan'];

  qbKeys.forEach(k => {
    if (!qbDataMap[k]) {
      console.error(`❌ QB.${k} key not found in parsed data!`);
      process.exit(1);
    }
  });

  // 2. Validate all questions beforehand
  const validatedData = {};
  for (const key of qbKeys) {
    const { validQuestions, errors } = validateQuestionsList(key, qbDataMap[key].questions);
    if (errors.length > 0) {
      console.error(`❌ Validation failed for QB.${key} with ${errors.length} errors:`);
      errors.forEach(e => console.error(`   - ${e}`));
      process.exit(1);
    }
    validatedData[key] = validQuestions;
  }
  console.log('✅ All remaining questions validated successfully.');

  // 3. Setup categories
  console.log('\n--- Setup Category targets ---');
  
  // A. edu_acts target category verification
  const lawCatDoc = await db.collection('categories').doc(EXISTING_LAW_CAT_ID).get();
  if (!lawCatDoc.exists) {
    console.error(`❌ Existing Category ID "${EXISTING_LAW_CAT_ID}" not found!`);
    process.exit(1);
  }
  const lawCatName = lawCatDoc.data().name;
  console.log(`  Target category A: "${lawCatName}" (${EXISTING_LAW_CAT_ID})`);

  // B. civil_servant + kharachkan target category verification
  let csCategoryId = 'NEW_CATEGORY_ID_PLACEHOLDER';
  let csCategoryExists = false;
  
  const existingCsCatSnap = await db.collection('categories')
    .where('name', '==', NEW_CATEGORY_NAME)
    .limit(1)
    .get();

  if (!existingCsCatSnap.empty) {
    existingCsCatSnap.forEach(doc => {
      csCategoryId = doc.id;
    });
    csCategoryExists = true;
    console.log(`  Target category B: "${NEW_CATEGORY_NAME}" already exists with ID: ${csCategoryId}`);
  } else {
    console.log(`  Target category B: "${NEW_CATEGORY_NAME}" does not exist. A new category will be created.`);
  }

  // 4. Duplicate checks in Firestore before import
  console.log('\n--- Duplicate check against Firestore ---');
  
  const checkImported = async (catId, sourceTag) => {
    if (catId === 'NEW_CATEGORY_ID_PLACEHOLDER') return false;
    const snap = await db.collection('questions')
      .where('categoryId', '==', catId)
      .where('source', '==', sourceTag)
      .limit(1)
      .get();
    return !snap.empty;
  };

  const eduActsImported = await checkImported(EXISTING_LAW_CAT_ID, 'hardcoded_QB_edu_acts_import');
  const civilServantImported = await checkImported(csCategoryId, 'hardcoded_QB_civil_servant_import');
  const kharachkanImported = await checkImported(csCategoryId, 'hardcoded_QB_kharachkan_import');

  let abort = false;
  if (eduActsImported) {
    console.warn(`  ⚠️  QB.edu_acts was already imported to "${lawCatName}"`);
    if (!force) abort = true;
  }
  if (civilServantImported) {
    console.warn(`  ⚠️  QB.civil_servant was already imported to "${NEW_CATEGORY_NAME}"`);
    if (!force) abort = true;
  }
  if (kharachkanImported) {
    console.warn(`  ⚠️  QB.kharachkan was already imported to "${NEW_CATEGORY_NAME}"`);
    if (!force) abort = true;
  }

  if (abort) {
    console.error('❌ Aborting to prevent duplicate imports. Run with --force flag if override is desired.');
    process.exit(1);
  }

  // Active counts before
  const lawActiveBefore = (await db.collection('questions')
    .where('categoryId', '==', EXISTING_LAW_CAT_ID)
    .where('isActive', '==', true)
    .get()).size;

  let csActiveBefore = 0;
  if (csCategoryExists) {
    csActiveBefore = (await db.collection('questions')
      .where('categoryId', '==', csCategoryId)
      .where('isActive', '==', true)
      .get()).size;
  }

  // 5. Dry-run Report
  console.log('\n--- DRY-RUN SUMMARY REPORT ---');
  console.log(`1. QB.edu_acts:`);
  console.log(`   - Count: ${validatedData.edu_acts.length} questions`);
  console.log(`   - Target: "${lawCatName}" (${EXISTING_LAW_CAT_ID})`);
  console.log(`   - Active count before: ${lawActiveBefore}`);
  console.log(`   - Active count after: ${lawActiveBefore + validatedData.edu_acts.length}`);
  console.log(`   - Expected action: merge_into_existing`);

  console.log(`2. QB.civil_servant + QB.kharachkan (combined):`);
  console.log(`   - Count: ${validatedData.civil_servant.length + validatedData.kharachkan.length} questions (${validatedData.civil_servant.length} cs + ${validatedData.kharachkan.length} kharachkan)`);
  console.log(`   - Target: "${NEW_CATEGORY_NAME}" (${csCategoryId})`);
  console.log(`   - Active count before: ${csActiveBefore}`);
  console.log(`   - Active count after: ${csActiveBefore + validatedData.civil_servant.length + validatedData.kharachkan.length}`);
  console.log(`   - Expected action: ${csCategoryExists ? 'use_existing_category' : 'create_new_category'}`);

  if (dryRun) {
    console.log('\n✅ DRY-RUN COMPLETE. No data was written.');
    process.exit(0);
  }

  // 6. Apply mode
  console.log('\n--- APPLYING CHANGES ---');
  const now = new Date();
  
  // Create category B if it doesn't exist
  if (!csCategoryExists) {
    console.log(`Creating new category: "${NEW_CATEGORY_NAME}"...`);
    const newCatRef = db.collection('categories').doc();
    csCategoryId = newCatRef.id;
    await newCatRef.set({
      name: NEW_CATEGORY_NAME,
      isActive: true,
      order: 8,
      createdAt: now,
      updatedAt: now
    });
    console.log(`  ✅ Category created successfully. ID: ${csCategoryId}`);
  }

  // Helper for bulk import
  const importQuestionsBatch = async (key, questions, catId, catName, sourceTag) => {
    const importBatch = `${key}_import_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const BATCH_SIZE = 400;
    let imported = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const chunk = questions.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      chunk.forEach(q => {
        const docRef = db.collection('questions').doc();
        batch.set(docRef, {
          categoryId: catId,
          categoryName: catName,
          questionText: q.questionText,
          choices: q.choices,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
          source: sourceTag,
          importBatch: importBatch,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          legacyMongoId: null
        });
      });

      await batch.commit();
      imported += chunk.length;
      console.log(`  [${key.toUpperCase()}] Batch committed: ${imported}/${questions.length}`);
    }

    // Mark pack stale
    try {
      const idxRef = db.collection('examPackIndexes').doc(catId);
      const idxDoc = await idxRef.get();
      if (idxDoc.exists) {
        await idxRef.update({ isStale: true, updatedAt: now });
      } else {
        // Create an index document draft
        await idxRef.set({
          categoryId: catId,
          categoryName: catName,
          version: 0,
          totalQuestions: 0,
          chunkCount: 0,
          isPublished: false,
          isStale: true,
          compiledAt: null,
          updatedAt: now
        });
      }
      console.log(`  [${key.toUpperCase()}] Exam pack marked as stale.`);
    } catch (e) {
      console.warn(`  [${key.toUpperCase()}] Could not update stale status: ${e.message}`);
    }
  };

  // Import A: edu_acts
  console.log(`Importing QB.edu_acts to "${lawCatName}"...`);
  await importQuestionsBatch('edu_acts', validatedData.edu_acts, EXISTING_LAW_CAT_ID, lawCatName, 'hardcoded_QB_edu_acts_import');

  // Import B: civil_servant
  console.log(`Importing QB.civil_servant to "${NEW_CATEGORY_NAME}"...`);
  await importQuestionsBatch('civil_servant', validatedData.civil_servant, csCategoryId, NEW_CATEGORY_NAME, 'hardcoded_QB_civil_servant_import');

  // Import C: kharachkan
  console.log(`Importing QB.kharachkan to "${NEW_CATEGORY_NAME}"...`);
  await importQuestionsBatch('kharachkan', validatedData.kharachkan, csCategoryId, NEW_CATEGORY_NAME, 'hardcoded_QB_kharachkan_import');

  console.log(`\n✅ ALL IMPORTS COMPLETED SUCCESSFULLY.`);
  console.log(`   New category: "${NEW_CATEGORY_NAME}" (ID: ${csCategoryId})`);
  console.log(`   Please run compilation for IDs:`);
  console.log(`     - ${EXISTING_LAW_CAT_ID} ("${lawCatName}")`);
  console.log(`     - ${csCategoryId} ("${NEW_CATEGORY_NAME}")`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
