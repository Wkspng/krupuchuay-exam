const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Application Default Credentials work on Cloud Run and locally when
// GOOGLE_APPLICATION_CREDENTIALS points to a service-account file. Keep all
// credential material outside this repository.
const app = getApps()[0] || initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
const auth = getAuth(app);

module.exports = { app, db, auth };

