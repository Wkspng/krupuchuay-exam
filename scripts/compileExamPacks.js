const { db } = require('../src/firebaseAdmin');
const firestoreExamPackService = require('../services/firestoreExamPackService');

// Minimal command line parser
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');
const all = args.includes('--all');

const catIndex = args.indexOf('--categoryId');
let categoryId = null;
if (catIndex !== -1 && args[catIndex + 1]) {
  categoryId = args[catIndex + 1];
}

if (!dryRun && !apply) {
  console.log('Error: Please specify either --dry-run or --apply');
  console.log('Usage:');
  console.log('  node scripts/compileExamPacks.js --dry-run --categoryId <id>');
  console.log('  node scripts/compileExamPacks.js --apply --categoryId <id>');
  console.log('  node scripts/compileExamPacks.js --dry-run --all');
  console.log('  node scripts/compileExamPacks.js --apply --all');
  process.exit(1);
}

if (!all && !categoryId) {
  console.log('Error: Please specify either --categoryId <id> or --all');
  process.exit(1);
}

async function processCategory(catId) {
  try {
    if (dryRun) {
      const res = await firestoreExamPackService.compileCategoryExamPack(catId, { dryRun: true });
      console.log(`\n=== DRY-RUN RESULT FOR CATEGORY: ${res.categoryName} (${res.categoryId}) ===`);
      console.log(`Total active questions: ${res.activeQuestions || res.totalQuestions}`);
      console.log(`Expected Chunks count: ${res.estimatedChunkCount}`);
      console.log(`Estimated total size: ${((res.estimatedSizeBytes || 0) / 1024).toFixed(2)} KB`);
      if (res.warnings && res.warnings.length > 0) {
        res.warnings.forEach(w => console.warn(`  ⚠️ ${w}`));
      }
      if (res.invalidQuestions && res.invalidQuestions.length > 0) {
        console.warn(`  ❌ Invalid questions: ${res.invalidQuestions.length}`);
        res.invalidQuestions.slice(0, 10).forEach(q => console.warn(`     - ${q.id}: ${q.reason}`));
      }
    } else {
      console.log(`Compiling and publishing pack for category ID: ${catId}...`);
      const res = await firestoreExamPackService.compileCategoryExamPack(catId, { dryRun: false });
      console.log(`✅ [APPLY] Successfully compiled and published pack for category: ${res.categoryName} (Version: ${res.version}, Chunks: ${res.chunkCount})`);
    }
  } catch (err) {
    console.error(`❌ Error compiling category ${catId}:`, err.message);
  }
}

async function main() {
  console.log(`=== STARTING EXAM PACKS COMPILATION ===`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (No writes)' : 'APPLY (Will write to Firestore)'}`);

  if (all) {
    console.log('Compiling all categories...');
    const catSnapshot = await db.collection('categories').get();
    for (const catDoc of catSnapshot.docs) {
      await processCategory(catDoc.id);
    }
  } else {
    await processCategory(categoryId);
  }

  // Refresh precomputed practice topic counts so badges stay in sync with the
  // question bank after a recompile (no separate admin step needed).
  if (!dryRun) {
    try {
      const practiceCountService = require('../services/firestorePracticeCountService');
      const res = await practiceCountService.computeAndStoreCounts();
      console.log(`\n✅ Refreshed practice topic counts (${res.topics} topics)`);
    } catch (err) {
      console.error('⚠️  Failed to refresh practice topic counts:', err.message);
    }
  }

  console.log(`\n=== COMPILATION COMPLETED ===`);
}

main().catch(console.error);
