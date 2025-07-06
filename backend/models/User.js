import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, enum: ['admin', 'company_member'], required: true }
});

export default mongoose.model('User', userSchema);
