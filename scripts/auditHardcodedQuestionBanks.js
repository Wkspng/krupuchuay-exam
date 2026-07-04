/**
 * Audit all hardcoded question banks in public/app.js vs Firestore.
 *
 * Usage:
 *   node scripts/auditHardcodedQuestionBanks.js --dry-run
 *
 * Reports:
 *   - All QB.<key> arrays and their question counts
 *   - Mapped Firestore categories and their question counts
 *   - Exam Pack status per category
 *   - Duplicate detection (hardcoded vs Firestore)
 *   - Recommended actions
 */

const { db } = require('../src/firebaseAdmin');
const { parseAllQuestionBanks, QB_KEY_TO_CATEGORY_NAME, QB_KEY_TO_DISPLAY_NAME } = require('./utils/parseHardcodedQuestionBanks');

async function main() {
  console.log('\n========================================');
  console.log('  HARDCODED QB AUDIT REPORT');
  console.log('========================================\n');

  // 1. Parse all hardcoded question banks
  console.log('--- Step 1: Parsing QB arrays from public/app.js ---\n');
  const qbData = parseAllQuestionBanks();
  const qbKeys = Object.keys(qbData);
  console.log(`Found ${qbKeys.length} QB keys: ${qbKeys.join(', ')}\n`);

  for (const key of qbKeys) {
    console.log(`  QB.${key}: ${qbData[key].count} questions (lines ${qbData[key].startLine}-${qbData[key].endLine})`);
  }

  // 2. Load all Firestore categories
  console.log('\n--- Step 2: Loading Firestore categories ---\n');
  const categoriesSnap = await db.collection('categories').get();
  const categories = [];
  categoriesSnap.forEach(doc => {
    categories.push({ id: doc.id, ...doc.data() });
  });
  console.log(`Found ${categories.length} Firestore categories\n`);

  // 3. Build category name → categoryId map
  const catNameToId = {};
  for (const cat of categories) {
    catNameToId[cat.name] = cat.id;
  }

  // 4. For each unique target category name, count questions in Firestore
  console.log('--- Step 3: Counting Firestore questions per category ---\n');
  const uniqueCatNames = [...new Set(Object.values(QB_KEY_TO_CATEGORY_NAME))];
  const firestoreCounts = {}; // catName → { categoryId, total, active, inactive }

  for (const catName of uniqueCatNames) {
    const categoryId = catNameToId[catName];
    if (!categoryId) {
      firestoreCounts[catName] = { categoryId: null, total: 0, active: 0, inactive: 0 };
      console.log(`  ⚠️  "${catName}" → NO CATEGORY IN FIRESTORE`);
      continue;
    }

    const allSnap = await db.collection('questions')
      .where('categoryId', '==', categoryId)
      .get();

    let active = 0, inactive = 0;
    allSnap.forEach(doc => {
      const d = doc.data();
      if (d.isActive === true) active++;
      else inactive++;
    });

    firestoreCounts[catName] = { categoryId, total: allSnap.size, active, inactive };
    console.log(`  "${catName}" (${categoryId}): total=${allSnap.size}, active=${active}, inactive=${inactive}`);
  }

  // 5. Check Exam Pack status per category
  console.log('\n--- Step 4: Checking Exam Pack status ---\n');
  const packStatus = {}; // catName → { status, version, totalQuestions, chunkCount }

  for (const catName of uniqueCatNames) {
    const categoryId = catNameToId[catName];
    if (!categoryId) {
      packStatus[catName] = { status: 'no_category', version: null, totalQuestions: 0, chunkCount: 0 };
      continue;
    }

    const indexDoc = await db.collection('examPackIndexes').doc(categoryId).get();
    if (!indexDoc.exists) {
      packStatus[catName] = { status: 'missing', version: null, totalQuestions: 0, chunkCount: 0 };
      console.log(`  "${catName}": MISSING (no exam pack)`);
    } else {
      const data = indexDoc.data();
      const status = data.isStale ? 'stale' : (data.isPublished ? 'published' : 'unpublished');
      packStatus[catName] = {
        status,
        version: data.version,
        totalQuestions: data.totalQuestions || 0,
        chunkCount: data.chunkCount || 0
      };
      console.log(`  "${catName}": ${status} v${data.version} (${data.totalQuestions} qs, ${data.chunkCount} chunks)`);
    }
  }

  // 6. Duplicate detection (for categories that have both hardcoded + Firestore)
  console.log('\n--- Step 5: Duplicate detection (hardcoded vs Firestore) ---\n');
  const duplicateResults = {}; // qbKey → { overlap, overlapPct }

  for (const key of qbKeys) {
    const catName = QB_KEY_TO_CATEGORY_NAME[key];
    const categoryId = catNameToId[catName];

    if (!categoryId || firestoreCounts[catName].total === 0) {
      duplicateResults[key] = { overlap: 0, overlapPct: 0, checked: false };
      continue;
    }

    // Load Firestore questions for this category
    const fsSnap = await db.collection('questions')
      .where('categoryId', '==', categoryId)
      .where('isActive', '==', true)
      .get();

    const fsTexts = new Set();
    fsSnap.forEach(doc => {
      const text = (doc.data().questionText || '').trim().toLowerCase();
      fsTexts.add(text);
    });

    // Compare with hardcoded
    let overlap = 0;
    for (const q of qbData[key].questions) {
      const text = (q.q || '').trim().toLowerCase();
      if (fsTexts.has(text)) overlap++;
    }

    const overlapPct = qbData[key].count > 0 ? Math.round((overlap / qbData[key].count) * 100) : 0;
    duplicateResults[key] = { overlap, overlapPct, checked: true };

    if (overlap > 0) {
      console.log(`  QB.${key}: ${overlap}/${qbData[key].count} questions match Firestore (${overlapPct}%)`);
    }
  }

  // 7. Determine action for each QB key
  console.log('\n--- Step 6: Determining recommended actions ---\n');
  const rows = [];

  for (const key of qbKeys) {
    const catName = QB_KEY_TO_CATEGORY_NAME[key];
    const displayName = QB_KEY_TO_DISPLAY_NAME[key] || catName;
    const categoryId = catNameToId[catName] || 'N/A';
    const hardcodedCount = qbData[key].count;
    const fsData = firestoreCounts[catName] || { active: 0, total: 0 };
    const pack = packStatus[catName] || { status: 'missing', version: null, totalQuestions: 0, chunkCount: 0 };
    const dup = duplicateResults[key] || { overlap: 0, overlapPct: 0 };

    let action = 'review_required';

    if (!catNameToId[catName]) {
      action = 'no_category_mapping';
    } else if (dup.overlapPct >= 80) {
      action = 'already_migrated';
    } else if (fsData.active === 0 && hardcodedCount > 0) {
      action = 'import_needed';
    } else if (fsData.active > 0 && fsData.active !== hardcodedCount && dup.overlapPct < 80) {
      action = 'mismatch_count';
    } else if (fsData.active > 0 && dup.overlapPct >= 50) {
      action = 'partially_migrated';
    } else if (fsData.active > 0) {
      action = 'review_required';
    }

    // Special: check if multiple QB keys share the same category
    const sharedKeys = qbKeys.filter(k => QB_KEY_TO_CATEGORY_NAME[k] === catName);
    const isSharedCategory = sharedKeys.length > 1;

    rows.push({
      key,
      displayName,
      catName,
      categoryId,
      hardcodedCount,
      fsActiveCount: fsData.active,
      fsTotalCount: fsData.total,
      packStatus: pack.status,
      packVersion: pack.version,
      packQuestions: pack.totalQuestions,
      packChunks: pack.chunkCount,
      overlapPct: dup.overlapPct,
      action,
      isSharedCategory,
      sharedWith: isSharedCategory ? sharedKeys.filter(k => k !== key).join(', ') : ''
    });
  }

  // 8. Print summary table
  console.log('='.repeat(160));
  console.log('  AUDIT SUMMARY TABLE');
  console.log('='.repeat(160));
  console.log('');

  const header = [
    'QB Key'.padEnd(16),
    'Display Name'.padEnd(28),
    'HC'.padStart(4),
    'FS Active'.padStart(10),
    'Overlap%'.padStart(9),
    'Pack Status'.padEnd(12),
    'Pack Ver'.padStart(9),
    'Pack Qs'.padStart(8),
    'Action'.padEnd(22),
    'Note'
  ].join(' | ');
  console.log(header);
  console.log('-'.repeat(160));

  for (const r of rows) {
    const note = r.isSharedCategory ? `shared w/ ${r.sharedWith}` : '';
    const line = [
      r.key.padEnd(16),
      r.displayName.substring(0, 28).padEnd(28),
      String(r.hardcodedCount).padStart(4),
      String(r.fsActiveCount).padStart(10),
      (r.overlapPct + '%').padStart(9),
      r.packStatus.padEnd(12),
      (r.packVersion !== null ? 'v' + r.packVersion : '-').padStart(9),
      String(r.packQuestions).padStart(8),
      r.action.padEnd(22),
      note
    ].join(' | ');
    console.log(line);
  }

  console.log('-'.repeat(160));

  // 9. Print action summary
  console.log('\n--- ACTION SUMMARY ---\n');
  const actionCounts = {};
  for (const r of rows) {
    actionCounts[r.action] = (actionCounts[r.action] || 0) + 1;
  }
  for (const [action, count] of Object.entries(actionCounts)) {
    const icon = action === 'already_migrated' ? '✅' :
                 action === 'import_needed' ? '📥' :
                 action === 'mismatch_count' ? '⚠️' :
                 action === 'no_category_mapping' ? '❌' :
                 action === 'partially_migrated' ? '🔄' : '🔍';
    console.log(`  ${icon} ${action}: ${count} QB key(s)`);
  }

  // 10. Detailed recommendations
  console.log('\n--- DETAILED RECOMMENDATIONS ---\n');

  const importNeeded = rows.filter(r => r.action === 'import_needed');
  if (importNeeded.length > 0) {
    console.log('📥 IMPORT NEEDED (hardcoded only, no Firestore data):');
    for (const r of importNeeded) {
      console.log(`   - QB.${r.key} → "${r.catName}" (${r.categoryId}): ${r.hardcodedCount} questions`);
      if (r.isSharedCategory) {
        console.log(`     ⚠️  Shares category with: ${r.sharedWith}`);
        console.log(`     → Import both QB keys into same category, deduplicate`);
      }
    }
    console.log('');
  }

  const alreadyMigrated = rows.filter(r => r.action === 'already_migrated');
  if (alreadyMigrated.length > 0) {
    console.log('✅ ALREADY MIGRATED (>= 80% overlap):');
    for (const r of alreadyMigrated) {
      console.log(`   - QB.${r.key}: ${r.overlapPct}% overlap, Firestore has ${r.fsActiveCount} active`);
    }
    console.log('');
  }

  const mismatched = rows.filter(r => r.action === 'mismatch_count');
  if (mismatched.length > 0) {
    console.log('⚠️  COUNT MISMATCH (Firestore count differs from hardcoded):');
    for (const r of mismatched) {
      console.log(`   - QB.${r.key}: hardcoded=${r.hardcodedCount}, Firestore active=${r.fsActiveCount}, overlap=${r.overlapPct}%`);
    }
    console.log('');
  }

  const noMapping = rows.filter(r => r.action === 'no_category_mapping');
  if (noMapping.length > 0) {
    console.log('❌ NO CATEGORY MAPPING:');
    for (const r of noMapping) {
      console.log(`   - QB.${r.key}: mapped to "${r.catName}" but category NOT FOUND in Firestore`);
    }
    console.log('');
  }

  // 11. Shared category analysis
  const sharedCats = {};
  for (const r of rows) {
    if (r.isSharedCategory) {
      if (!sharedCats[r.catName]) sharedCats[r.catName] = [];
      sharedCats[r.catName].push(r);
    }
  }

  if (Object.keys(sharedCats).length > 0) {
    console.log('🔗 SHARED CATEGORIES (multiple QB keys → same Firestore category):');
    for (const [catName, items] of Object.entries(sharedCats)) {
      const totalHC = items.reduce((s, r) => s + r.hardcodedCount, 0);
      console.log(`   "${catName}" (${items[0].categoryId}):`);
      for (const r of items) {
        console.log(`     - QB.${r.key} (${r.displayName}): ${r.hardcodedCount} questions`);
      }
      console.log(`     → Combined hardcoded total: ${totalHC} questions`);
      console.log(`     → Firestore active: ${items[0].fsActiveCount}`);
      console.log(`     → Need to import all keys into same category and deduplicate`);
      console.log('');
    }
  }

  // Grand totals
  console.log('\n--- GRAND TOTALS ---');
  const totalHardcoded = rows.reduce((s, r) => s + r.hardcodedCount, 0);
  const totalFSActive = new Set(rows.map(r => r.catName)).size; // unique categories
  let totalFSActiveQs = 0;
  for (const catName of new Set(rows.map(r => r.catName))) {
    totalFSActiveQs += (firestoreCounts[catName] || {}).active || 0;
  }
  console.log(`  Total hardcoded questions: ${totalHardcoded}`);
  console.log(`  Total Firestore active questions (across mapped categories): ${totalFSActiveQs}`);
  console.log(`  Unique Firestore categories mapped: ${[...new Set(rows.map(r => r.catName))].length}`);

  console.log('\n========================================');
  console.log('  AUDIT COMPLETE');
  console.log('========================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
