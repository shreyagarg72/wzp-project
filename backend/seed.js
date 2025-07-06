import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const users = [
  { userId: 30001, username: 'Lalit Kumar', mobile: '8607031007', email: 'name@domain.com', address: 'Rewari, Haryana' },
  { userId: 30002, username: 'Aman Yadav', mobile: '9416469864', email: 'name@domain.com', address: 'Rewari, Haryana' },
  { userId: 30003, username: 'Sandeep Yadav', mobile: '9254032760', email: 'name@domain.com', address: 'Rewari, Haryana' },
  { userId: 30004, username: 'Kuldeep Yadav', mobile: '9254032761', email: 'name@domain.com', address: 'Rewari, Haryana' },
  { userId: 30005, username: 'Ashok', mobile: '9728494103', email: 'name@domain.com', address: 'Mehasana, Gujarat' },
  { userId: 30006, username: 'Manoj', mobile: '7988847661', email: 'name@domain.com', address: 'Mehasana, Gujarat' },
  { userId: 30007, username: 'Suraj', mobile: '9979607962', email: 'name@domain.com', address: 'Mehasana, Gujarat' },
  { userId: 30008, username: 'Birender', mobile: '9254032764', email: 'name@domain.com', address: 'Rewari, Haryana' },
  { userId: 30009, username: 'Suman', mobile: '7206757697', email: 'name@domain.com', address: 'Rewari, Haryana' },
  { userId: 30010, username: 'Meenakshi', mobile: '9254032765', email: 'name@domain.com', address: 'Rewari, Haryana' },
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await User.deleteMany(); // Optional: Clear existing users

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(`pass${u.userId}`, 10);

      await User.create({
        ...u,
        password: hashedPassword,
        type: 'company_member',
      });
    }

    console.log('✅ Seeding complete!');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding users:', err);
    process.exit(1);
  }
}

seedUsers();
