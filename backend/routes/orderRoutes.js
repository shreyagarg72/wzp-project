import express from 'express';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/logActivity.js"; // Assuming this is your utility to log activities
const router = express.Router();

router.post('/:action', async (req, res) => {
  const { action } = req.params;
  const { inquiryId } = req.body;

  const authHeader = req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });

  let decodedUser;
  try {
    decodedUser = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    if (!['accept', 'decline', 'edit'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const inquiry = await Inquiry.findOne({ inquiryId });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const order = await Order.findOne({ inquiryId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (action === 'accept') {
      order.status = 'Accept';
      inquiry.status = 'Fulfilled';
      inquiry.fulfilledAt = new Date();
      await order.save();
      await inquiry.save();

      // ✅ Log activity
      await logActivity({
        userId: decodedUser.id,
        action: 'Accepted Order',
        targetType: 'Order',
        targetId: order._id,
        details: {
          inquiryId,
          orderStatus: 'Accept',
        },
      });

      return res.json({ message: 'Order accepted' });
    }

    if (action === 'decline') {
      order.status = 'Decline';
      await order.save();

      // ✅ Log activity
      await logActivity({
        userId: decodedUser.id,
        action: 'Declined Order',
        targetType: 'Order',
        targetId: order._id,
        details: {
          inquiryId,
          orderStatus: 'Decline',
        },
      });

      return res.json({ message: 'Order declined' });
    }

    if (action === 'edit') {
      order.status = 'Negotiation';
      await order.save();

      inquiry.status = 'Completed';
      await inquiry.save();

      // ✅ Log activity
      await logActivity({
        userId: decodedUser.id,
        action: 'Requested Order Edit',
        targetType: 'Order',
        targetId: order._id,
        details: {
          inquiryId,
          newStatus: 'Negotiation',
        },
      });

      return res.json({
        message: 'Order moved to negotiation',
        order,
      });
    }

  } catch (err) {
    console.error('Order action error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({}, "inquiryId status"); // fetch only required fields
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


export default router;
