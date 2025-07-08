import mongoose from 'mongoose';

const productLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  quantity: { type: Number, required: true },
  category: { type: String },
  description: { type: String },
  specifications: { type: String },
  uom: { type: String }
}, { _id: false });

const inquirySchema = new mongoose.Schema({
  inquiryId: { type: [String] }, // e.g. INQ-0001
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  products: [productLineSchema],
  expectedDelivery: { type: Date },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Open', 'Processing', 'Fulfilled'], default: 'Open' }
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);
export default Inquiry;
