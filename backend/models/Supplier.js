import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  supplierId: { type: Number, unique: true, required: true },
  companyName: { type: String, required: true },
  supplierName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: false },
  gstin: { type: String, required: false },
  specialization: [{ type: String }], // Array of product categories they specialize in
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);