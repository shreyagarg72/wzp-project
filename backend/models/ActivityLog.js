import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String // e.g. "Customer", "Inquiry", "Supplier"
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId // ID of the affected item
  },
  details: {
    type: Object // optional: { name: "ABC Corp", status: "Pending" }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("ActivityLog", ActivityLogSchema);
