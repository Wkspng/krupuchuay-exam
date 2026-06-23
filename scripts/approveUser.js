require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const User = require('../models/User');

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
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env');
    process.exitCode = 1;
    return;
  }

  const email = emailInput.trim().toLowerCase();
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
    if (!user) {
      console.error('No user was found for the supplied email.');
      process.exitCode = 1;
      return;
    }
    console.log('User account approved.');
  } catch (error) {
    console.error('Unable to approve user. Check the database connection and supplied email.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
