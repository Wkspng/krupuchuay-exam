require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const User = require('../models/User');
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

    // 2. Sync to MongoDB
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate(
          { email },
          {
            $set: {
              status: 'approved',
              approvalStatus: 'approved',
              isApproved: true,
              approvedAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { returnDocument: 'after', runValidators: true },
        );
        if (user) {
          console.log('MongoDB: User status synchronized.');
        } else {
          // If they aren't in MongoDB, create them (with dummy password/info) so legacy routes work
          await User.create({
            username: email,
            name: 'Firebase User',
            email,
            role: 'user',
            status: 'approved',
            approvalStatus: 'approved',
            isApproved: true,
            approvedAt: new Date(),
          });
          console.log('MongoDB: User did not exist, synced placeholder user record.');
        }
      } catch (mongoErr) {
        console.warn('MongoDB sync failed or skipped:', mongoErr.message);
      } finally {
        await mongoose.disconnect();
      }
    } else {
      console.log('MongoDB: Skipped (MONGODB_URI missing).');
    }

    console.log(`Success: User account ${email} approved successfully.`);
  } catch (error) {
    console.error('Unable to approve user:', error);
    process.exitCode = 1;
  }
}

main();
