const { db } = require('../src/firebaseAdmin');
const { mapDoc } = require('./firestoreHelper');

function categorySummary(attempts) {
  const groups = new Map();
  attempts.forEach((attempt) => {
    const key = attempt.categoryName || String(attempt.categoryId || 'unknown');
    const current = groups.get(key) || { categoryName: key, attempts: 0, scoreTotal: 0 };
    current.attempts += 1;
    current.scoreTotal += attempt.scorePercent;
    groups.set(key, current);
  });
  return [...groups.values()].map((group) => ({
    ...group,
    averageScore: Number((group.scoreTotal / group.attempts).toFixed(2))
  }));
}

function examSetSummary(attempts) {
  const groups = new Map();
  attempts.filter((attempt) => attempt.examSetId || attempt.examSetTitle).forEach((attempt) => {
    const key = String(attempt.examSetId || attempt.examSetTitle);
    const current = groups.get(key) || {
      examSetId: attempt.examSetId || null,
      examSetTitle: attempt.examSetTitle || 'ไม่ระบุชุดข้อสอบ',
      attempts: 0,
      scoreTotal: 0,
      passedCount: 0
    };
    current.attempts += 1;
    current.scoreTotal += attempt.scorePercent;
    if (attempt.passed) current.passedCount += 1;
    groups.set(key, current);
  });
  return [...groups.values()]
    .map((group) => ({
      ...group,
      averageScore: Number((group.scoreTotal / group.attempts).toFixed(2))
    }))
    .sort((left, right) => right.attempts - left.attempts);
}

async function getMyStats(userId) {
  // Fetch up to 1000 recent attempts for user
  const snapshot = await db.collection('examAttempts')
    .where('userId', '==', userId)
    .limit(1000)
    .get();

  const attempts = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) attempts.push(mapped);
  });

  // In-memory sort by submittedAt DESC
  attempts.sort((a, b) => {
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return timeB - timeA;
  });

  const totalAttempts = attempts.length;
  const averageScore = totalAttempts
    ? Number((attempts.reduce((total, attempt) => total + attempt.scorePercent, 0) / totalAttempts).toFixed(2))
    : 0;

  const categoryStats = categorySummary(attempts);
  const examSetStats = examSetSummary(attempts);
  const mostFrequentCategory = categoryStats.sort((a, b) => b.attempts - a.attempts)[0] || null;
  const lowestScoreCategory = [...categoryStats].sort((a, b) => a.averageScore - b.averageScore)[0] || null;
  
  const trend = attempts
    .slice(0, 10)
    .reverse()
    .map((attempt) => ({
      submittedAt: attempt.submittedAt,
      scorePercent: attempt.scorePercent,
      categoryName: attempt.categoryName || 'ไม่ระบุหมวด'
    }));

  return {
    totalAttempts,
    averageScore,
    bestScore: totalAttempts ? Math.max(...attempts.map((attempt) => attempt.scorePercent)) : 0,
    latestScore: totalAttempts ? attempts[0].scorePercent : null,
    mostFrequentCategory,
    lowestScoreCategory,
    trend,
    categoryStats,
    examSetStats
  };
}

async function getOverviewStats() {
  // Use Firestore count aggregation for total users and total questions
  const totalUsersSnapshot = await db.collection('users').count().get();
  const totalUsers = totalUsersSnapshot.data().count;

  const totalQuestionsSnapshot = await db.collection('questions').count().get();
  const totalQuestions = totalQuestionsSnapshot.data().count;

  // Fetch up to 1000 recent attempts for overview stats
  const snapshot = await db.collection('examAttempts')
    .limit(1000)
    .get();

  const attempts = [];
  snapshot.forEach(doc => {
    const mapped = mapDoc(doc);
    if (mapped) attempts.push(mapped);
  });

  // In-memory sort by submittedAt DESC
  attempts.sort((a, b) => {
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return timeB - timeA;
  });

  const totalAttempts = attempts.length;
  const averageScore = totalAttempts
    ? Number((attempts.reduce((total, attempt) => total + attempt.scorePercent, 0) / totalAttempts).toFixed(2))
    : 0;

  // Group top users in-memory from the 1000 loaded attempts
  const userGroups = new Map();
  attempts.filter(a => a.userId).forEach(a => {
    const key = a.userId;
    const current = userGroups.get(key) || { userId: key, attempts: 0, scorePercentSum: 0, bestScore: 0 };
    current.attempts += 1;
    current.scorePercentSum += a.scorePercent;
    if (a.scorePercent > current.bestScore) {
      current.bestScore = a.scorePercent;
    }
    userGroups.set(key, current);
  });

  const sortedGroups = [...userGroups.values()]
    .map(g => ({
      userId: g.userId,
      attempts: g.attempts,
      averageScore: g.scorePercentSum / g.attempts,
      bestScore: g.bestScore
    }))
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      return b.attempts - a.attempts;
    })
    .slice(0, 10);

  // Fetch user profiles for top 10 users
  const topUsers = [];
  for (const group of sortedGroups) {
    const userDoc = await db.collection('users').doc(group.userId).get();
    topUsers.push({
      userId: group.userId,
      name: userDoc.exists ? (userDoc.data().name || 'ผู้ใช้ที่ไม่พบแล้ว') : 'ผู้ใช้ที่ไม่พบแล้ว',
      email: userDoc.exists ? (userDoc.data().email || userDoc.data().username || '—') : '—',
      attempts: group.attempts,
      averageScore: Number(group.averageScore.toFixed(2)),
      bestScore: group.bestScore
    });
  }

  const categoryStats = categorySummary(attempts);
  const examSetStats = examSetSummary(attempts);
  const mostAttemptedCategory = [...categoryStats].sort((a, b) => b.attempts - a.attempts)[0] || null;
  const lowestScoreCategory = [...categoryStats].sort((a, b) => a.averageScore - b.averageScore)[0] || null;

  return {
    totalUsers,
    totalQuestions,
    totalAttempts,
    averageScore,
    topUsers,
    mostAttemptedCategory,
    lowestScoreCategory,
    categoryStats,
    examSetStats
  };
}

module.exports = {
  getMyStats,
  getOverviewStats
};
