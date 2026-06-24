const { db: firestoreDb } = require('../src/firebaseAdmin');

async function getHealth(req, res) {
  try {
    // Verify Firestore database is reachable by performing a limit 1 read on categories
    await firestoreDb.collection('categories').limit(1).get();

    return res.json({
      status: 'ok',
      database: 'firestore',
      projectId: process.env.FIREBASE_PROJECT_ID || 'moonlight-krupuchuay-exam',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Firestore connection failed',
    });
  }
}

module.exports = { getHealth };
