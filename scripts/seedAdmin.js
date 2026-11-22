import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const { MONGO_URI, ADMIN_NAME = 'Security Office', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (existing) {
  existing.role = 'admin';
  await existing.save();
  console.log(`Promoted ${ADMIN_EMAIL} to admin`);
} else {
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    role: 'admin',
  });
  console.log(`Created admin ${ADMIN_EMAIL}`);
}
await mongoose.disconnect();
