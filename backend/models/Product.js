import mongoose from 'mongoose';

let autoId = 3001;

const productSchema = new mongoose.Schema({
  productId: { type: Number, default: () => autoId++ },  // e.g. PROD-0001
  productName: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  specifications: { type: String },
  uom: { type: String }, // Unit of Measure, e.g. pcs, kg
  inquiryId: { type: [String], default: [] } // Array of inquiry IDs - multiple inquiries can reference same product
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const Product = mongoose.model('Product', productSchema);
export default Product;