const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

function categorySummary(attempts) {
  const groups = new Map();
  attempts.forEach((attempt) => {
    const key = attempt.categoryName || String(attempt.categoryId || 'unknown');
    const current = groups.get(key) || { categoryName: key, attempts: 0, scoreTotal: 0 };
    current.attempts += 1;
    current.scoreTotal += attempt.scorePercent;
    groups.set(key, current);
  });
  return [...groups.values()].map((group) => ({ ...group, averageScore: Number((group.scoreTotal / group.attempts).toFixed(2)) }));
}

function examSetSummary(attempts) {
  const groups = new Map();
  attempts.filter((attempt) => attempt.examSetId || attempt.examSetTitle).forEach((attempt) => {
    const key = String(attempt.examSetId || attempt.examSetTitle);
    const current = groups.get(key) || { examSetId: attempt.examSetId || null, examSetTitle: attempt.examSetTitle || 'ไม่ระบุชุดข้อสอบ', attempts: 0, scoreTotal: 0, passedCount: 0 };
    current.attempts += 1;
    current.scoreTotal += attempt.scorePercent;
    if (attempt.passed) current.passedCount += 1;
    groups.set(key, current);
  });
  return [...groups.values()]
    .map((group) => ({ ...group, averageScore: Number((group.scoreTotal / group.attempts).toFixed(2)) }))
    .sort((left, right) => right.attempts - left.attempts);
}

async function getMyStats(req, res) {
  try {
    const attempts = await ExamAttempt.find({ userId: req.user.sub }).sort({ submittedAt: -1 }).lean();
    const totalAttempts = attempts.length;
    const averageScore = totalAttempts ? Number((attempts.reduce((total, attempt) => total + attempt.scorePercent, 0) / totalAttempts).toFixed(2)) : 0;
    const categoryStats = categorySummary(attempts);
    const examSetStats = examSetSummary(attempts);
    const mostFrequentCategory = categoryStats.sort((a, b) => b.attempts - a.attempts)[0] || null;
    const lowestScoreCategory = [...categoryStats].sort((a, b) => a.averageScore - b.averageScore)[0] || null;
    const trend = attempts.slice(0, 10).reverse().map((attempt) => ({ submittedAt: attempt.submittedAt, scorePercent: attempt.scorePercent, categoryName: attempt.categoryName || 'ไม่ระบุหมวด' }));
    return res.json({
      totalAttempts,
      averageScore,
      bestScore: totalAttempts ? Math.max(...attempts.map((attempt) => attempt.scorePercent)) : 0,
      latestScore: totalAttempts ? attempts[0].scorePercent : null,
      mostFrequentCategory,
      lowestScoreCategory,
      trend,
      categoryStats,
      examSetStats,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load your statistics' });
  }
}

async function getOverviewStats(req, res) {
  try {
    const [totalUsers, totalQuestions, attempts, topGroups] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      ExamAttempt.find({}).sort({ submittedAt: -1 }).lean(),
      ExamAttempt.aggregate([
        { $match: { userId: { $ne: null } } },
        { $group: { _id: '$userId', attempts: { $sum: 1 }, averageScore: { $avg: '$scorePercent' }, bestScore: { $max: '$scorePercent' } } },
        { $sort: { averageScore: -1, bestScore: -1, attempts: -1 } },
        { $limit: 10 },
      ]),
    ]);
    const userIds = topGroups.map((group) => group._id);
    const users = await User.find({ _id: { $in: userIds } }, 'name email username').lean();
    const userById = new Map(users.map((user) => [String(user._id), user]));
    const topUsers = topGroups.map((group) => {
      const user = userById.get(String(group._id));
      return {
        userId: group._id,
        name: user?.name || 'ผู้ใช้ที่ไม่พบแล้ว',
        email: user?.email || user?.username || '—',
        attempts: group.attempts,
        averageScore: Number(group.averageScore.toFixed(2)),
        bestScore: group.bestScore,
      };
    });
    const categoryStats = categorySummary(attempts);
    const examSetStats = examSetSummary(attempts);
    const mostAttemptedCategory = [...categoryStats].sort((a, b) => b.attempts - a.attempts)[0] || null;
    const lowestScoreCategory = [...categoryStats].sort((a, b) => a.averageScore - b.averageScore)[0] || null;
    const totalAttempts = attempts.length;
    return res.json({
      totalUsers,
      totalQuestions,
      totalAttempts,
      averageScore: totalAttempts ? Number((attempts.reduce((total, attempt) => total + attempt.scorePercent, 0) / totalAttempts).toFixed(2)) : 0,
      topUsers,
      mostAttemptedCategory,
      lowestScoreCategory,
      categoryStats,
      examSetStats,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load overview statistics' });
  }
}

module.exports = { getMyStats, getOverviewStats };
