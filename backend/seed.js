import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const users = [
  {
    username: 'admin1',
    password: 'admin123',
    type: 'admin',
  },
  {
    username: 'member1',
    password: 'member123',
    type: 'company_member',
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    await User.deleteMany(); // optional: clears previous users

    for (let user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      await User.create(user);
    }

    console.log('🌱 Seeding completed!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedUsers();
