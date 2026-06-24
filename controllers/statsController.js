const firestoreStatsService = require('../services/firestoreStatsService');

async function getMyStats(req, res) {
  try {
    const stats = await firestoreStatsService.getMyStats(req.user.sub);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load your statistics' });
  }
}

async function getOverviewStats(req, res) {
  try {
    const stats = await firestoreStatsService.getOverviewStats();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load overview statistics' });
  }
}

module.exports = { getMyStats, getOverviewStats };
