/**
 * Audit script for English category data mismatch investigation.
 * Usage:
 *   node scripts/auditEnglishCategory.js --dry-run
 *   node scripts/auditEnglishCategory.js --apply   (requires approval)
 */

const { db } = require('../src/firebaseAdmin');

async function main() {
  const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
  console.log(`\n=== ENGLISH CATEGORY AUDIT (${mode.toUpperCase()}) ===\n`);

  // 1. Find all categories related to English
  console.log('--- 1. Scanning categories for "ภาษาอังกฤษ" or "english" ---');
  const categoriesSnap = await db.collection('categories').get();
  const englishCategories = [];
  const allCategories = [];

  categoriesSnap.forEach(doc => {
    const data = doc.data();
    allCategories.push({ id: doc.id, ...data });
    const name = (data.name || '').toLowerCase();
    const desc = (data.description || '').toLowerCase();
    const code = (data.code || data.key || '').toLowerCase();
    if (name.includes('ภาษาอังกฤษ') || name.includes('english') ||
        desc.includes('ภาษาอังกฤษ') || desc.includes('english') ||
        code.includes('english')) {
      englishCategories.push({ id: doc.id, ...data });
    }
  });

  console.log(`Total categories: ${allCategories.length}`);
  console.log(`English-related categories found: ${englishCategories.length}`);
  englishCategories.forEach(cat => {
    console.log(`  - ID: ${cat.id}`);
    console.log(`    Name: ${cat.name}`);
    console.log(`    isActive: ${cat.isActive}`);
    console.log(`    order: ${cat.order}`);
    console.log(`    createdAt: ${cat.createdAt ? (cat.createdAt.toDate ? cat.createdAt.toDate().toISOString() : cat.createdAt) : 'N/A'}`);
    console.log(`    updatedAt: ${cat.updatedAt ? (cat.updatedAt.toDate ? cat.updatedAt.toDate().toISOString() : cat.updatedAt) : 'N/A'}`);
    console.log('');
  });

  // 2. Find all questions related to English
  console.log('--- 2. Scanning questions for English-related entries ---');
  const allEnglishCategoryIds = englishCategories.map(c => c.id);
  
  // Query by each English categoryId
  let totalQuestionsFound = 0;
  let totalActive = 0;
  let totalInactive = 0;
  const questionsByCategoryId = {};

  for (const catId of allEnglishCategoryIds) {
    const qSnap = await db.collection('questions')
      .where('categoryId', '==', catId)
      .get();
    const questions = [];
    qSnap.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    
    const active = questions.filter(q => q.isActive === true).length;
    const inactive = questions.filter(q => q.isActive === false || q.isActive === undefined).length;
    
    questionsByCategoryId[catId] = { total: questions.length, active, inactive };
    totalQuestionsFound += questions.length;
    totalActive += active;
    totalInactive += inactive;
    
    console.log(`  CategoryId: ${catId}`);
    console.log(`    Total questions: ${questions.length}`);
    console.log(`    Active: ${active}`);
    console.log(`    Inactive: ${inactive}`);
    console.log('');
  }

  // Also scan for questions with categoryName containing English
  console.log('--- 2b. Scanning questions by categoryName containing "ภาษาอังกฤษ" ---');
  const qByNameSnap = await db.collection('questions')
    .where('categoryName', '>=', 'ภาษาอังกฤษ')
    .where('categoryName', '<=', 'ภาษาอังกฤษ\uf8ff')
    .get();
  
  const questionsByName = [];
  const categoryIdsFromQuestions = new Set();
  qByNameSnap.forEach(doc => {
    const data = doc.data();
    questionsByName.push({ id: doc.id, ...data });
    categoryIdsFromQuestions.add(data.categoryId);
  });

  console.log(`  Questions with categoryName starting with "ภาษาอังกฤษ": ${questionsByName.length}`);
  console.log(`  Unique categoryIds used by these questions: ${[...categoryIdsFromQuestions].join(', ')}`);
  
  // Check for categoryIds in questions that are NOT in our englishCategories list
  const missingCategoryIds = [...categoryIdsFromQuestions].filter(id => !allEnglishCategoryIds.includes(id));
  if (missingCategoryIds.length > 0) {
    console.log(`  ⚠️ Questions reference categoryIds NOT found in English categories: ${missingCategoryIds.join(', ')}`);
    for (const missingId of missingCategoryIds) {
      const catDoc = await db.collection('categories').doc(missingId).get();
      if (catDoc.exists) {
        console.log(`    -> Category ${missingId} exists: name="${catDoc.data().name}", isActive=${catDoc.data().isActive}`);
      } else {
        console.log(`    -> Category ${missingId} DOES NOT EXIST in categories collection!`);
      }
      
      // Count questions for this missing categoryId
      const missingQSnap = await db.collection('questions')
        .where('categoryId', '==', missingId)
        .get();
      const missingActive = [];
      const missingInactive = [];
      missingQSnap.forEach(doc => {
        const d = doc.data();
        if (d.isActive === true) missingActive.push(doc.id);
        else missingInactive.push(doc.id);
      });
      console.log(`    -> Questions: total=${missingQSnap.size}, active=${missingActive.length}, inactive=${missingInactive.length}`);
    }
  }
  console.log('');

  // 3. Check examPackIndexes for English categories
  console.log('--- 3. Checking examPackIndexes for English categories ---');
  const allEnglishIds = [...new Set([...allEnglishCategoryIds, ...categoryIdsFromQuestions])];
  for (const catId of allEnglishIds) {
    const indexDoc = await db.collection('examPackIndexes').doc(catId).get();
    if (indexDoc.exists) {
      const data = indexDoc.data();
      console.log(`  CategoryId: ${catId}`);
      console.log(`    categoryName: ${data.categoryName}`);
      console.log(`    version: ${data.version}`);
      console.log(`    totalQuestions: ${data.totalQuestions}`);
      console.log(`    chunkCount: ${data.chunkCount}`);
      console.log(`    isPublished: ${data.isPublished}`);
      console.log(`    isStale: ${data.isStale}`);
      console.log(`    compiledAt: ${data.compiledAt ? (data.compiledAt.toDate ? data.compiledAt.toDate().toISOString() : data.compiledAt) : 'N/A'}`);
    } else {
      console.log(`  CategoryId: ${catId} - NO EXAM PACK INDEX`);
    }
    console.log('');
  }

  // 4. Check exam sets referencing English
  console.log('--- 4. Checking exam sets referencing English categories ---');
  const examSetsSnap = await db.collection('examSets').get();
  examSetsSnap.forEach(doc => {
    const data = doc.data();
    const rules = data.categoryRules || [];
    const englishRules = rules.filter(r => allEnglishIds.includes(r.categoryId));
    if (englishRules.length > 0) {
      console.log(`  ExamSet: ${doc.id} - "${data.title}"`);
      englishRules.forEach(r => {
        console.log(`    Rule: categoryId=${r.categoryId}, questionCount=${r.questionCount}`);
      });
    }
  });
  console.log('');

  // 5. Summary and recommendations
  console.log('=== SUMMARY & RECOMMENDATIONS ===');
  console.log(`English categories: ${englishCategories.map(c => `${c.id} ("${c.name}")`).join(', ')}`);
  console.log(`Total English questions (by categoryId): ${totalQuestionsFound} (active: ${totalActive}, inactive: ${totalInactive})`);
  console.log(`Total English questions (by categoryName): ${questionsByName.length}`);
  
  if (missingCategoryIds.length > 0) {
    console.log(`\n⚠️ ROOT CAUSE CANDIDATE: Questions reference categoryId(s) ${missingCategoryIds.join(', ')} which may not match the active English category.`);
  }
  
  if (englishCategories.length > 1) {
    console.log(`\n⚠️ ROOT CAUSE CANDIDATE: Multiple English categories exist. Possible duplicate.`);
  }

  const zeroQuestionCategories = englishCategories.filter(c => {
    const counts = questionsByCategoryId[c.id];
    return !counts || counts.total === 0;
  });
  if (zeroQuestionCategories.length > 0) {
    console.log(`\n⚠️ ROOT CAUSE CANDIDATE: English category(ies) with 0 questions: ${zeroQuestionCategories.map(c => c.id).join(', ')}`);
  }

  console.log('\n=== AUDIT COMPLETE ===\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
