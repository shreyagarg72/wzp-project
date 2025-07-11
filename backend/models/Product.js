import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productId: {
    type: Number,
    unique: true,
    required: true,
  },
  productName: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  specifications: { type: String },
  uom: { type: String },
  inquiryId: { type: [String], default: [] }
}, {
  timestamps: true
});

// Counter to handle multiple products in same millisecond
let timestampCounter = 0;
let lastTimestamp = 0;

const generateUniqueTimestampId = () => {
  const now = Date.now();
  
  if (now === lastTimestamp) {
    // Same millisecond - increment counter
    timestampCounter++;
  } else {
    // New millisecond - reset counter
    timestampCounter = 0;
    lastTimestamp = now;
  }
  
  // Combine timestamp with counter
  // Format: timestamp + counter (padded to 3 digits)
  const uniqueId = parseInt(`${now}${timestampCounter.toString().padStart(3, '0')}`);
  
  return uniqueId;
};

productSchema.pre('validate', async function (next) {
  if (this.isNew && !this.productId) {
    try {
      this.productId = generateUniqueTimestampId();
      console.log('Generated unique timestamp ID:', this.productId);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

export default mongoose.model('Product', productSchema);