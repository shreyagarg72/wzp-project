import mongoose from 'mongoose';

const getNextProductId = async () => {
  const lastProduct = await mongoose.model('Product').findOne().sort({ productId: -1 });
  return lastProduct ? lastProduct.productId + 1 : 401;
};

const productSchema = new mongoose.Schema({
  productId: { type: Number, 
    unique: true, 
    required: true  },  // e.g. PROD-0001
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
productSchema.pre('validate', async function(next) {
  if (this.isNew && !this.productId) {
    this.productId = await getNextProductId();
  }
  next();
});
const Product = mongoose.model('Product', productSchema);
export default Product;