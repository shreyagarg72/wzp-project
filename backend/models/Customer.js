import mongoose from 'mongoose';
let autoId = 10001;

const customerSchema = new mongoose.Schema({
  custId: { type: Number, default: () => autoId++ },
  companyName: String,
  customerName: String,
  email: String,
  mobile: String,
  address: String,
  gstin: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true }

);
export default mongoose.model('Customer', customerSchema);