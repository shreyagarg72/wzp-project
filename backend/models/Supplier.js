import mongoose from 'mongoose';

// We'll get the next ID dynamically instead of using a static variable
const getNextSupplierId = async () => {
  const lastSupplier = await mongoose.model('Supplier').findOne().sort({ supplierId: -1 });
  return lastSupplier ? lastSupplier.supplierId + 1 : 401;
};

const supplierSchema = new mongoose.Schema({
  supplierId: { 
    type: Number, 
    unique: true, 
    required: true 
  },
  companyName: { type: String, required: true },
  supplierName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  gstin: { type: String },
  specialization: { type: [String], default: [] }, // e.g. ['Hardware', 'Electrical']
  inquirySent: [
    {
      inquiryId: { type: String },
      productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
      // This stores actual MongoDB ObjectIds
    }
  ]

}, { timestamps: true });

// Pre-validate middleware to set supplierId before validation
supplierSchema.pre('validate', async function(next) {
  if (this.isNew && !this.supplierId) {
    this.supplierId = await getNextSupplierId();
  }
  next();
});

export default mongoose.model('Supplier', supplierSchema);