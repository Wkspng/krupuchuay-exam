const firestorePracticeCountService = require('../services/firestorePracticeCountService');

// Returns precomputed per-topic question counts (1 Firestore read) so the
// practice home page does not have to download every question just to count.
async function getTopicCounts(req, res) {
  try {
    const data = await firestorePracticeCountService.getStoredCounts();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load practice topic counts' });
  }
}

module.exports = { getTopicCounts };
