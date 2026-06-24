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
  const emailInput = argumentValue('--email');
  if (!isValidEmail(emailInput)) {
    console.error('Usage: npm run approve-user -- --email "user@example.com"');
    process.exitCode = 1;
    return;
  }

  const email = emailInput.trim().toLowerCase();
  try {
    // 1. Approve in Firestore
    const userQuery = await firestoreDb.collection('users').where('email', '==', email).limit(1).get();
    let uid;
    
    if (userQuery.empty) {
      console.log('User not found in Firestore. Querying Firebase Auth...');
      try {
        const firebaseUser = await firebaseAuth.getUserByEmail(email);
        uid = firebaseUser.uid;
        await firestoreDb.collection('users').doc(uid).set({
          uid,
          email,
          name: firebaseUser.displayName || 'No Name',
          role: 'user',
          approvalStatus: 'approved',
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          approvedAt: new Date(),
        });
        console.log(`Firestore: Profile created and approved for Firebase user ${uid}.`);
      } catch (authErr) {
        console.error('User not found in Firebase Auth either.');
        process.exitCode = 1;
        return;
      }
    } else {
      const doc = userQuery.docs[0];
      uid = doc.id;
      await doc.ref.update({
        approvalStatus: 'approved',
        isApproved: true,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Firestore: User ${uid} approved.`);
    }

    console.log(`Success: User account ${email} approved successfully.`);
  } catch (error) {
    console.error('Unable to approve user:', error);
    process.exitCode = 1;
  }
}

main();
