require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
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
  const name = argumentValue('--name');
  const emailInput = argumentValue('--email');
  const password = argumentValue('--password');

  if (typeof name !== 'string' || !name.trim() || !isValidEmail(emailInput) || typeof password !== 'string' || password.length < 6) {
    console.error('Usage: npm run create-admin -- --name "Admin" --email "admin@example.com" --password "at-least-6-characters"');
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
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const existingUser = await User.findOne({ $or: [{ email }, { username: email }] });

    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.email = email;
      existingUser.passwordHash = passwordHash;
      existingUser.role = 'admin';
      existingUser.status = 'approved';
      existingUser.approvalStatus = 'approved';
      existingUser.isApproved = true;
      existingUser.approvedAt = now;
      await existingUser.save();
      console.log('Admin account updated and approved.');
    } else {
      await User.create({
        username: email,
        name: name.trim(),
        email,
        passwordHash,
        role: 'admin',
        status: 'approved',
        approvalStatus: 'approved',
        isApproved: true,
        approvedAt: now,
      });
      console.log('Admin account created and approved.');
    }
  } catch (error) {
    console.error('Unable to create or update admin account. Check the database connection and supplied arguments.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
