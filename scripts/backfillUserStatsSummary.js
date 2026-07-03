const { db } = require('../src/firebaseAdmin');
const firestoreUserStatsSummaryService = require('../services/firestoreUserStatsSummaryService');

// Minimal command line parser
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');
const force = args.includes('--force');

const limitIndex = args.indexOf('--limit');
let limit = 50; // default limit
if (limitIndex !== -1 && args[limitIndex + 1]) {
  limit = parseInt(args[limitIndex + 1], 10) || 50;
}

if (!dryRun && !apply) {
  console.log('Error: Please specify either --dry-run or --apply');
  console.log('Usage:');
  console.log('  node scripts/backfillUserStatsSummary.js --dry-run [--limit 10] [--force]');
  console.log('  node scripts/backfillUserStatsSummary.js --apply [--limit 100] [--force]');
  process.exit(1);
}

async function main() {
  console.log(`=== STARTING USER STATS SUMMARY BACKFILL ===`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (No writes)' : 'APPLY (Will write to Firestore)'}`);
  console.log(`Limit: ${limit} users`);
  console.log(`Force rebuild: ${force ? 'YES' : 'NO'}`);

  // Fetch users
  const usersSnapshot = await db.collection('users').get();
  console.log(`Total users found in database: ${usersSnapshot.size}`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    if (processedCount >= limit) {
      console.log(`Limit reached (${limit} users processed). Stopping.`);
      break;
    }

    const userId = userDoc.id;

    // Check if summary already exists
    const summaryDoc = await db.collection('userStatsSummary').doc(userId).get();
    
    if (summaryDoc.exists && !force) {
      skippedCount++;
      continue;
    }

    processedCount++;

    try {
      if (dryRun) {
        // Query attempts to see what would be rebuilt
        const attemptsSnap = await db.collection('examAttempts')
          .where('userId', '==', userId)
          .get();
        console.log(`[DRY-RUN] Would rebuild user: ${userId} (${attemptsSnap.size} attempts)`);
      } else {
        await firestoreUserStatsSummaryService.rebuildUserStatsSummary(userId);
        console.log(`[APPLY] Rebuilt user stats summary for user: ${userId}`);
      }
    } catch (err) {
      console.error(`Error processing user ${userId}:`, err.message);
      errorCount++;
    }
  }

  console.log(`=== BACKFILL COMPLETED ===`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(console.error);
