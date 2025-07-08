import mongoose from 'mongoose';

let autoId = 401;

const supplierSchema = new mongoose.Schema({
  supplierId: { type: Number, default: () => autoId++, unique: true, required: true },
  companyName: { type: String, required: true },
  supplierName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  gstin: { type: String },
  specialization: { type: [String], default: [] }, // e.g. ['Hardware', 'Electrical']
  inquirySent: { type: [String], default: [] }// store inquiryId strings like "INQ-0001"
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);
