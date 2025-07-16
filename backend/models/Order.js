import mongoose from 'mongoose';

const quoteItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  quantity: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  margin: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  inquiryId: { type: String, required: true },  // Just the inquiryId, no reference
  items: [quoteItemSchema],                     // Array of quoted products
  deliveryCharges: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
