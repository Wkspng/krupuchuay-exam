/**
 * E2E Integration test for Phase 3 Firestore Services
 */
const { db } = require('../src/firebaseAdmin');
const firestoreCategoryService = require('../services/firestoreCategoryService');
const firestoreQuestionService = require('../services/firestoreQuestionService');
const firestoreExamSetService = require('../services/firestoreExamSetService');
const firestoreExamAttemptService = require('../services/firestoreExamAttemptService');
const firestoreStatsService = require('../services/firestoreStatsService');

async function runTests() {
  console.log('=== STARTING FIRESTORE SERVICES E2E TESTS ===');
  
  const mockUser = {
    sub: 'test-user-uid-12345',
    role: 'user',
    name: 'Test Student',
    email: 'test_student@example.com'
  };

  const mockAdmin = {
    sub: 'test-admin-uid-67890',
    role: 'admin',
    name: 'Test Admin',
    email: 'test_admin@example.com'
  };

  let testCategoryId;
  let testQuestionId;
  let testExamSetId;
  let testAttemptId;

  try {
    // ----------------------------------------------------
    // 1. CATEGORY TESTS
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Category Service ---');
    const newCategory = await firestoreCategoryService.createCategory({
      name: `Test Category ${Date.now()}`,
      description: 'Test Description',
      order: 10,
      isActive: true
    });
    testCategoryId = newCategory.id;
    console.log('Category created:', newCategory.id, newCategory.name);

    const retrievedCategory = await firestoreCategoryService.getCategoryById(testCategoryId);
    if (!retrievedCategory || retrievedCategory.name !== newCategory.name) {
      throw new Error('Retrieved category name does not match created');
    }
    console.log('Retrieved category successfully.');

    const updatedCategory = await firestoreCategoryService.updateCategory(testCategoryId, {
      description: 'Updated Description'
    });
    if (updatedCategory.description !== 'Updated Description') {
      throw new Error('Category update description failed');
    }
    console.log('Updated category successfully.');

    // ----------------------------------------------------
    // 2. QUESTION TESTS
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Question Service ---');
    const newQuestion = await firestoreQuestionService.createQuestion({
      categoryId: testCategoryId,
      questionText: `Test Question text ${Date.now()}`,
      choices: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
      correctAnswerIndex: 1,
      difficulty: 'easy',
      explanation: 'Explanation text'
    });
    testQuestionId = newQuestion.id;
    console.log('Question created:', newQuestion.id);

    const retrievedQuestion = await firestoreQuestionService.getQuestionById(testQuestionId);
    if (!retrievedQuestion || retrievedQuestion.correctAnswerIndex !== 1) {
      throw new Error('Retrieved question failed check');
    }
    console.log('Retrieved question successfully.');

    const randomQuestions = await firestoreQuestionService.getRandomQuestions(testCategoryId, 5);
    console.log(`Retrieved ${randomQuestions.length} random questions for category.`);
    if (randomQuestions.length === 0) {
      throw new Error('Random questions list is empty');
    }

    // ----------------------------------------------------
    // 3. EXAM SET TESTS
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Exam Set Service ---');
    const newExamSet = await firestoreExamSetService.createExamSet({
      title: `Test Exam Set ${Date.now()}`,
      description: 'Set Description',
      mode: 'exam',
      totalQuestions: 1,
      timeLimitMinutes: 10,
      passingScorePercent: 60,
      isActive: true,
      categoryRules: [
        {
          categoryId: testCategoryId,
          questionCount: 1
        }
      ]
    }, mockAdmin.sub);
    testExamSetId = newExamSet.id;
    console.log('Exam Set created:', newExamSet.id, newExamSet.title);

    const retrievedSet = await firestoreExamSetService.getExamSetById(testExamSetId);
    if (!retrievedSet || retrievedSet.title !== newExamSet.title) {
      throw new Error('Retrieved exam set failed');
    }
    console.log('Retrieved exam set successfully.');

    console.log('Starting exam session...');
    const session = await firestoreExamSetService.startExamSet(testExamSetId);
    console.log('Session started. Question count:', session.questions.length);
    if (session.questions.length !== 1) {
      throw new Error('Start exam session failed to retrieve matched questions');
    }

    // ----------------------------------------------------
    // 4. ATTEMPT TESTS
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Attempt Service ---');
    const newAttempt = await firestoreExamAttemptService.createExamAttempt({
      categoryId: testCategoryId,
      examSetId: testExamSetId,
      mode: 'exam',
      totalQuestions: 1,
      correctCount: 1,
      durationSeconds: 120,
      answers: [
        {
          questionId: testQuestionId,
          questionText: newQuestion.questionText,
          choices: newQuestion.choices,
          selectedAnswerIndex: 1,
          correctAnswerIndex: 1,
          isCorrect: true,
          explanation: 'Correct'
        }
      ]
    }, mockUser);
    testAttemptId = newAttempt.id;
    console.log('Attempt created:', newAttempt.id, 'Passed:', newAttempt.passed);
    if (newAttempt.passed !== true) {
      throw new Error('Attempt failed passing status check');
    }

    const retrievedAttempt = await firestoreExamAttemptService.getExamAttemptById(testAttemptId, mockUser);
    if (!retrievedAttempt || retrievedAttempt.scorePercent !== 100) {
      throw new Error('Retrieved attempt failed');
    }
    console.log('Retrieved attempt successfully.');

    const userAttempts = await firestoreExamAttemptService.getExamAttempts({ userId: mockUser.sub }, mockUser);
    console.log('User attempts count:', userAttempts.attempts.length);
    if (userAttempts.attempts.length === 0) {
      throw new Error('Get attempts failed');
    }

    // ----------------------------------------------------
    // 5. STATS TESTS
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Stats Service ---');
    const userStats = await firestoreStatsService.getMyStats(mockUser.sub);
    console.log('User Stats - Total Attempts:', userStats.totalAttempts, 'Average Score:', userStats.averageScore);
    if (userStats.totalAttempts === 0) {
      throw new Error('User stats failed');
    }

    const overviewStats = await firestoreStatsService.getOverviewStats();
    console.log('Overview Stats - Total Users:', overviewStats.totalUsers, 'Total Attempts:', overviewStats.totalAttempts);
    if (overviewStats.totalAttempts === 0) {
      throw new Error('Overview stats failed');
    }

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\n--- Cleaning up E2E Test data ---');
    // Delete attempt
    await db.collection('examAttempts').doc(testAttemptId).delete();
    console.log('Deleted test attempt.');

    // Soft delete Exam Set
    await firestoreExamSetService.deleteExamSet(testExamSetId);
    // Hard delete Exam Set to keep Firestore completely clean
    await db.collection('examSets').doc(testExamSetId).delete();
    console.log('Deleted test exam set.');

    // Soft delete question
    await firestoreQuestionService.deleteQuestion(testQuestionId);
    // Hard delete question to keep Firestore clean
    await db.collection('questions').doc(testQuestionId).delete();
    console.log('Deleted test question.');

    // Soft delete category
    await firestoreCategoryService.deleteCategory(testCategoryId);
    // Hard delete category to keep Firestore clean
    await db.collection('categories').doc(testCategoryId).delete();
    console.log('Deleted test category.');

    console.log('\n=== ALL FIRESTORE SERVICES E2E TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);

  } catch (err) {
    console.error('\n=== TEST RUN FAILED ===');
    console.error(err);
    
    // Cleanup on failure if possible
    try {
      if (testAttemptId) await db.collection('examAttempts').doc(testAttemptId).delete();
      if (testExamSetId) await db.collection('examSets').doc(testExamSetId).delete();
      if (testQuestionId) await db.collection('questions').doc(testQuestionId).delete();
      if (testCategoryId) await db.collection('categories').doc(testCategoryId).delete();
    } catch (cleanErr) {
      console.error('Failed to cleanup test data:', cleanErr);
    }
    
    process.exit(1);
  }
}

runTests();
