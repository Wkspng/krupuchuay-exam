const { db } = require('../src/firebaseAdmin');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

async function rebuildUserStatsSummary(userId) {
  // Query all examAttempts for this user ordered by submittedAt desc, then reverse in memory to get oldest-to-newest chronological order
  const snapshot = await db.collection('examAttempts')
    .where('userId', '==', userId)
    .orderBy('submittedAt', 'desc')
    .get();

  const attempts = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    attempts.push({ id: doc.id, ...data });
  });

  // Reverse to make it oldest-to-newest chronological order
  attempts.reverse();

  const totalAttempts = attempts.length;
  if (totalAttempts === 0) {
    const blankSummary = {
      userId,
      totalAttempts: 0,
      scorePercentSum: 0,
      averageScore: 0,
      bestScore: 0,
      latestScore: null,
      latestAttemptId: null,
      latestAttemptAt: null,
      categoryStats: {},
      examSetStats: {},
      trend: [],
      version: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      rebuiltAt: Timestamp.now()
    };
    await db.collection('userStatsSummary').doc(userId).set(blankSummary);
    return blankSummary;
  }

  let scorePercentSum = 0;
  let bestScore = 0;
  let latestScore = null;
  let latestAttemptId = null;
  let latestAttemptAt = null;

  const categoryStats = {};
  const examSetStats = {};
  const trend = [];

  for (const attempt of attempts) {
    const scorePercent = attempt.scorePercent;
    const catId = attempt.categoryId;
    const catName = attempt.categoryName || 'ไม่ระบุหมวด';
    const examSetId = attempt.examSetId;
    const examSetTitle = attempt.examSetTitle;
    const isPassed = attempt.passed;
    const attemptDate = attempt.submittedAt instanceof Date
      ? attempt.submittedAt
      : (attempt.submittedAt && attempt.submittedAt.toDate ? attempt.submittedAt.toDate() : new Date(attempt.submittedAt));

    scorePercentSum += scorePercent;
    bestScore = Math.max(bestScore, scorePercent);
    latestScore = scorePercent;
    latestAttemptId = attempt.id;
    latestAttemptAt = Timestamp.fromDate(attemptDate);

    // Category stats
    if (!categoryStats[catId]) {
      categoryStats[catId] = {
        categoryName: catName,
        attempts: 0,
        scorePercentSum: 0,
        bestScore: 0,
        latestScore: 0,
        latestAttemptAt: null
      };
    }
    const catStat = categoryStats[catId];
    catStat.attempts += 1;
    catStat.scorePercentSum += scorePercent;
    catStat.averageScore = Number((catStat.scorePercentSum / catStat.attempts).toFixed(2));
    catStat.bestScore = Math.max(catStat.bestScore, scorePercent);
    catStat.latestScore = scorePercent;
    catStat.latestAttemptAt = Timestamp.fromDate(attemptDate);

    // Exam set stats
    if (examSetId) {
      if (!examSetStats[examSetId]) {
        examSetStats[examSetId] = {
          examSetTitle: examSetTitle || 'ไม่ระบุชุดข้อสอบ',
          attempts: 0,
          scorePercentSum: 0,
          bestScore: 0,
          latestScore: 0,
          latestAttemptAt: null,
          passedCount: 0
        };
      }
      const esStat = examSetStats[examSetId];
      esStat.attempts += 1;
      esStat.scorePercentSum += scorePercent;
      esStat.averageScore = Number((esStat.scorePercentSum / esStat.attempts).toFixed(2));
      esStat.bestScore = Math.max(esStat.bestScore, scorePercent);
      esStat.latestScore = scorePercent;
      esStat.latestAttemptAt = Timestamp.fromDate(attemptDate);
      if (isPassed) {
        esStat.passedCount += 1;
      }
    }

    // Trend
    trend.push({
      attemptId: attempt.id,
      submittedAt: Timestamp.fromDate(attemptDate),
      scorePercent: scorePercent,
      categoryId: catId,
      categoryName: catName,
      examSetId: examSetId || null,
      examSetTitle: examSetTitle || null
    });
  }

  // Slice trend to latest 20 items (trend is oldest to newest, so slice the last 20)
  const slicedTrend = trend.slice(-20);

  const summaryPayload = {
    userId,
    totalAttempts,
    scorePercentSum,
    averageScore: Number((scorePercentSum / totalAttempts).toFixed(2)),
    bestScore,
    latestScore,
    latestAttemptId,
    latestAttemptAt,
    categoryStats,
    examSetStats,
    trend: slicedTrend,
    version: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    rebuiltAt: Timestamp.now()
  };

  await db.collection('userStatsSummary').doc(userId).set(summaryPayload);
  return summaryPayload;
}

async function updateUserStatsSummaryWithAttempt(userId, attempt) {
  const summaryRef = db.collection('userStatsSummary').doc(userId);

  await db.runTransaction(async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);
    const attemptDate = attempt.submittedAt instanceof Date
      ? attempt.submittedAt
      : (attempt.submittedAt && attempt.submittedAt.toDate ? attempt.submittedAt.toDate() : new Date(attempt.submittedAt));

    const scorePercent = attempt.scorePercent;
    const catId = attempt.categoryId;
    const catName = attempt.categoryName || 'ไม่ระบุหมวด';
    const examSetId = attempt.examSetId;
    const examSetTitle = attempt.examSetTitle;
    const isPassed = attempt.passed;

    const newTrendItem = {
      attemptId: attempt.id,
      submittedAt: Timestamp.fromDate(attemptDate),
      scorePercent: scorePercent,
      categoryId: catId,
      categoryName: catName,
      examSetId: examSetId || null,
      examSetTitle: examSetTitle || null
    };

    if (!summaryDoc.exists) {
      // Create new summary
      const newSummary = {
        userId,
        totalAttempts: 1,
        scorePercentSum: scorePercent,
        averageScore: Number(scorePercent.toFixed(2)),
        bestScore: scorePercent,
        latestScore: scorePercent,
        latestAttemptId: attempt.id,
        latestAttemptAt: Timestamp.fromDate(attemptDate),
        categoryStats: {
          [catId]: {
            categoryName: catName,
            attempts: 1,
            scorePercentSum: scorePercent,
            averageScore: Number(scorePercent.toFixed(2)),
            bestScore: scorePercent,
            latestScore: scorePercent,
            latestAttemptAt: Timestamp.fromDate(attemptDate)
          }
        },
        examSetStats: examSetId ? {
          [examSetId]: {
            examSetTitle: examSetTitle || 'ไม่ระบุชุดข้อสอบ',
            attempts: 1,
            scorePercentSum: scorePercent,
            averageScore: Number(scorePercent.toFixed(2)),
            bestScore: scorePercent,
            latestScore: scorePercent,
            latestAttemptAt: Timestamp.fromDate(attemptDate),
            passedCount: isPassed ? 1 : 0
          }
        } : {},
        trend: [newTrendItem],
        version: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        rebuiltAt: null
      };
      transaction.set(summaryRef, newSummary);
    } else {
      const current = summaryDoc.data();

      const totalAttempts = (current.totalAttempts || 0) + 1;
      const scorePercentSum = (current.scorePercentSum || 0) + scorePercent;
      const averageScore = Number((scorePercentSum / totalAttempts).toFixed(2));
      const bestScore = Math.max(current.bestScore || 0, scorePercent);

      // Update categoryStats
      const categoryStats = current.categoryStats || {};
      const catStat = categoryStats[catId] || {
        categoryName: catName,
        attempts: 0,
        scorePercentSum: 0,
        bestScore: 0,
        latestScore: 0,
        latestAttemptAt: null
      };
      catStat.attempts = (catStat.attempts || 0) + 1;
      catStat.scorePercentSum = (catStat.scorePercentSum || 0) + scorePercent;
      catStat.averageScore = Number((catStat.scorePercentSum / catStat.attempts).toFixed(2));
      catStat.bestScore = Math.max(catStat.bestScore || 0, scorePercent);
      catStat.latestScore = scorePercent;
      catStat.latestAttemptAt = Timestamp.fromDate(attemptDate);
      categoryStats[catId] = catStat;

      // Update examSetStats
      const examSetStats = current.examSetStats || {};
      if (examSetId) {
        const esStat = examSetStats[examSetId] || {
          examSetTitle: examSetTitle || 'ไม่ระบุชุดข้อสอบ',
          attempts: 0,
          scorePercentSum: 0,
          bestScore: 0,
          latestScore: 0,
          latestAttemptAt: null,
          passedCount: 0
        };
        esStat.attempts = (esStat.attempts || 0) + 1;
        esStat.scorePercentSum = (esStat.scorePercentSum || 0) + scorePercent;
        esStat.averageScore = Number((esStat.scorePercentSum / esStat.attempts).toFixed(2));
        esStat.bestScore = Math.max(esStat.bestScore || 0, scorePercent);
        esStat.latestScore = scorePercent;
        esStat.latestAttemptAt = Timestamp.fromDate(attemptDate);
        if (isPassed) {
          esStat.passedCount = (esStat.passedCount || 0) + 1;
        }
        examSetStats[examSetId] = esStat;
      }

      // Update trend: append and cap at 20
      const trend = current.trend || [];
      trend.push(newTrendItem);
      if (trend.length > 20) {
        trend.shift();
      }

      transaction.update(summaryRef, {
        totalAttempts,
        scorePercentSum,
        averageScore,
        bestScore,
        latestScore: scorePercent,
        latestAttemptId: attempt.id,
        latestAttemptAt: Timestamp.fromDate(attemptDate),
        categoryStats,
        examSetStats,
        trend,
        updatedAt: Timestamp.now()
      });
    }
  });
}

module.exports = {
  rebuildUserStatsSummary,
  updateUserStatsSummaryWithAttempt
};
