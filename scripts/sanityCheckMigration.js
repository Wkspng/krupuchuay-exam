const { db } = require('../src/firebaseAdmin');

async function runSanityCheck() {
  console.log('=== STARTING FIRESTORE MIGRATION SANITY CHECK ===');
  let hasErrors = false;

  try {
    // 1. Fetch categories
    console.log('Fetching categories...');
    const categorySnapshot = await db.collection('categories').get();
    const categoryIds = new Set();
    categorySnapshot.forEach(doc => {
      categoryIds.add(doc.id);
    });
    console.log(`Found ${categoryIds.size} categories.`);

    // 2. Fetch users
    console.log('Fetching users...');
    const userSnapshot = await db.collection('users').get();
    const userIds = new Set();
    userSnapshot.forEach(doc => {
      userIds.add(doc.id);
    });
    console.log(`Found ${userIds.size} users.`);

    // 3. Fetch exam sets
    console.log('Fetching exam sets...');
    const examSetSnapshot = await db.collection('examSets').get();
    const examSetIds = new Set();
    const examSets = [];
    examSetSnapshot.forEach(doc => {
      examSetIds.add(doc.id);
      examSets.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${examSetIds.size} exam sets.`);

    // 4. Verify questions
    console.log('Verifying questions...');
    const questionSnapshot = await db.collection('questions').get();
    let questionCount = 0;
    let questionErrors = 0;
    questionSnapshot.forEach(doc => {
      questionCount++;
      const data = doc.data();
      if (!categoryIds.has(data.categoryId)) {
        console.error(`Mismatch: Question ID ${doc.id} references invalid categoryId "${data.categoryId}"`);
        questionErrors++;
        hasErrors = true;
      }
    });
    console.log(`Verified ${questionCount} questions. Mismatches found: ${questionErrors}`);

    // 5. Verify exam sets categoryRules
    console.log('Verifying exam sets rules...');
    let examSetErrors = 0;
    examSets.forEach(set => {
      const rules = set.categoryRules || [];
      rules.forEach((rule, idx) => {
        if (!categoryIds.has(rule.categoryId)) {
          console.error(`Mismatch: ExamSet ID ${set.id} rule[${idx}] references invalid categoryId "${rule.categoryId}"`);
          examSetErrors++;
          hasErrors = true;
        }
      });
    });
    console.log(`Verified exam sets. Mismatches found: ${examSetErrors}`);

    // 6. Verify exam attempts (limit 1000)
    console.log('Verifying recent exam attempts...');
    const attemptSnapshot = await db.collection('examAttempts').limit(1000).get();
    let attemptCount = 0;
    let attemptErrors = 0;
    attemptSnapshot.forEach(doc => {
      attemptCount++;
      const data = doc.data();
      // Verify Category reference
      if (data.categoryId && !categoryIds.has(data.categoryId)) {
        console.error(`Mismatch: ExamAttempt ID ${doc.id} references invalid categoryId "${data.categoryId}"`);
        attemptErrors++;
        hasErrors = true;
      }
      // Verify ExamSet reference
      if (data.examSetId && !examSetIds.has(data.examSetId)) {
        console.error(`Mismatch: ExamAttempt ID ${doc.id} references invalid examSetId "${data.examSetId}"`);
        attemptErrors++;
        hasErrors = true;
      }
      // Verify User reference (if user attempt)
      if (data.userId && !userIds.has(data.userId)) {
        // Some users might not be fully migrated if they are legacy or external, but let's check
        console.warn(`Warning: ExamAttempt ID ${doc.id} references userId "${data.userId}" which is not in Firestore users collection`);
      }
    });
    console.log(`Verified ${attemptCount} exam attempts. Reference errors found: ${attemptErrors}`);

    if (hasErrors) {
      console.error('\n=== SANITY CHECK FAILED: Found data integrity issues! ===');
      process.exit(1);
    } else {
      console.log('\n=== SANITY CHECK PASSED: Data integrity verified successfully! ===');
      process.exit(0);
    }

  } catch (err) {
    console.error('Error executing sanity check:', err);
    process.exit(1);
  }
}

runSanityCheck();
