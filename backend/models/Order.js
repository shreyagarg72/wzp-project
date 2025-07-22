import mongoose from "mongoose";

const quoteItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    specifications: { type: String },
    uom: { type: String },
    basePrice: { type: Number, required: true },
    margin: { type: Number },
    discount: { type: Number },
    gstRate: { type: Number },
    finalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  inquiryId: { type: String, required: true },
  items: [quoteItemSchema],
  deliveryCharges: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Open", "Sent", "Accept", "Negotiation", "Decline"],
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
