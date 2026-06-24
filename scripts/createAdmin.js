require('dotenv').config({ quiet: true });

const { auth: firebaseAuth, db: firestoreDb } = require('../src/firebaseAdmin');

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  const name = argumentValue('--name');
  const emailInput = argumentValue('--email');
  const password = argumentValue('--password');

  if (typeof name !== 'string' || !name.trim() || !isValidEmail(emailInput) || typeof password !== 'string' || password.length < 6) {
    console.error('Usage: npm run create-admin -- --name "Admin" --email "admin@example.com" --password "at-least-6-characters"');
    process.exitCode = 1;
    return;
  }

  const email = emailInput.trim().toLowerCase();
  let uid;

  try {
    // 1. Create or Update in Firebase Auth
    let userRecord;
    try {
      userRecord = await firebaseAuth.getUserByEmail(email);
      uid = userRecord.uid;
      await firebaseAuth.updateUser(uid, {
        password: password,
        displayName: name.trim(),
      });
      console.log('Firebase Auth: User updated.');
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        userRecord = await firebaseAuth.createUser({
          email: email,
          password: password,
          displayName: name.trim(),
        });
        uid = userRecord.uid;
        console.log('Firebase Auth: User created.');
      } else {
        throw authError;
      }
    }

    // 2. Set Custom User Claims for Admin
    await firebaseAuth.setCustomUserClaims(uid, { admin: true });
    console.log('Firebase Auth: Custom claim admin:true applied.');

    // 3. Write User Profile in Firestore
    await firestoreDb.collection('users').doc(uid).set({
      uid,
      email,
      name: name.trim(),
      role: 'admin',
      approvalStatus: 'approved',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Firestore: User profile saved.');

    console.log('Success: Admin account created/updated and approved in all systems.');
  } catch (error) {
    console.error('Error during admin creation:', error);
    process.exitCode = 1;
  }
}

main();
