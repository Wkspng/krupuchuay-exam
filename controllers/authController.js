const { auth: firebaseAuth, db: firestoreDb } = require('../src/firebaseAdmin');

function publicUser(user) {
  const approvalStatus = user.approvalStatus || user.status || (user.isApproved ? 'approved' : 'pending');
  return {
    id: user.uid,
    uid: user.uid,
    username: user.email,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus,
    isApproved: approvalStatus === 'approved',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getFirebaseConfig(req, res) {
  return res.json({
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  });
}

async function register(req, res) {
  const { name, idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userEmail = decodedToken.email;

    const userRef = firestoreDb.collection('users').doc(uid);
    const doc = await userRef.get();
    if (doc.exists) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userProfile = {
      uid,
      email: userEmail,
      name: name.trim(),
      role: 'user',
      approvalStatus: 'pending',
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRef.set(userProfile);

    return res.status(201).json({ user: publicUser(userProfile) });
  } catch (error) {
    console.error('Firebase register error:', error);
    return res.status(500).json({ error: 'Unable to register account' });
  }
}

async function login(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userEmail = decodedToken.email;

    const userRef = firestoreDb.collection('users').doc(uid);
    const doc = await userRef.get();
    let userProfile;

    if (!doc.exists) {
      // Automatically create a pending profile if it's missing in Firestore but exists in Firebase Auth
      userProfile = {
        uid,
        email: userEmail,
        name: decodedToken.name || 'No Name',
        role: 'user',
        approvalStatus: 'pending',
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await userRef.set(userProfile);
    } else {
      userProfile = doc.data();
    }

    const approvalStatus = userProfile.approvalStatus || userProfile.status || (userProfile.isApproved ? 'approved' : 'pending');

    // Set express session (in-memory dev fallback)
    req.session.user = {
      username: userProfile.email || userEmail,
      name: userProfile.name,
      role: userProfile.role || 'user',
      approvalStatus,
      isApproved: approvalStatus === 'approved',
    };

    return res.json({ token: idToken, user: publicUser(userProfile) });
  } catch (error) {
    console.error('Firebase login error:', error);
    return res.status(500).json({ error: 'Unable to log in' });
  }
}

module.exports = { register, login, getFirebaseConfig };
