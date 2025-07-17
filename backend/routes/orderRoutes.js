import express from 'express';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';

const router = express.Router();

router.post('/:action', async (req, res) => {
  const { action } = req.params;
  const { inquiryId } = req.body;

  try {
    if (!['accept', 'decline', 'edit'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Find the order using inquiryId
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

      // ✅ Remove order and inquiry after processing
      await Order.deleteOne({ inquiryId });
      await Inquiry.deleteOne({ inquiryId });

      return res.json({ message: 'Order accepted and removed from system' });
    }

    if (action === 'decline') {
      order.status = 'Decline';
      await order.save();

      // ✅ Remove order and inquiry after processing
      await Order.deleteOne({ inquiryId });
      await Inquiry.deleteOne({ inquiryId });

      return res.json({ message: 'Order declined and removed from system' });
    }

    if (action === 'edit') {
      // Mark status as negotiation and return order details
      order.status = 'Negotiation';
      await order.save();

      inquiry.status = 'Completed'; // Optional: can keep editable status
      await inquiry.save();

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

export default router;
