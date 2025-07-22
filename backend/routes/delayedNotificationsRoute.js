// routes/notifications.js
import express from "express";
import Inquiry from "../models/Inquiry.js";
import Order from "../models/Order.js";

const router = express.Router();

// GET /api/notifications/delayed-actions
router.get("/delayed-actions", async (req, res) => {
  try {
    const delayedActions = [];

    // 1. Inquiry raised but quote not sent (status = 'Open')
    const openInquiries = await Inquiry.find({ status: "Open" });
    openInquiries.forEach((inq) =>
      delayedActions.push({
        type: "Quote Not Sent",
        inquiryId: inq.inquiryId,
        message: `Quote not sent for Inquiry ${inq.inquiryId}`,
      })
    );

    // 2. Quote sent but prices not updated (status = 'Processing' and no prices)
    const processingInquiries = await Inquiry.find({ status: "Processing" });
    processingInquiries.forEach((inq) => {
      const hasPrice = inq.supplierQuotes?.some((sq) =>
        sq.quotes?.some((q) => q.price != null)
      );
      if (!hasPrice) {
        delayedActions.push({
          type: "Prices Missing",
          inquiryId: inq.inquiryId,
          message: `Prices not updated for Inquiry ${inq.inquiryId}`,
        });
      }
    });

    // 3. Inquiry Completed but quote not shared with company (status = 'Completed')
    const completedInquiries = await Inquiry.find({ status: "Completed" });
    completedInquiries.forEach((inq) =>
      delayedActions.push({
        type: "Quote Not Shared",
        inquiryId: inq.inquiryId,
        message: `Quote not shared with company for Inquiry ${inq.inquiryId}`,
      })
    );

    // 4. Inquiry Fulfilled but order status still Open
    const fulfilledInquiries = await Inquiry.find({ status: "Fulfilled" });
    const openOrders = await Order.find({ status: "Open" });
    const inquiryOrderMap = new Map();
    openOrders.forEach((order) => inquiryOrderMap.set(order.inquiryId, true));
    fulfilledInquiries.forEach((inq) => {
      if (inquiryOrderMap.has(inq.inquiryId)) {
        delayedActions.push({
          type: "Company Response Pending",
          inquiryId: inq.inquiryId,
          message: `Check for company response on Order for Inquiry ${inq.inquiryId}`,
        });
      }
    });

    // 5. Check for expected payment overdue - FIXED VERSION
    const today = new Date();
    
    // Get orders with Accept status and expectedPaymentDays
    const acceptedOrders = await Order.find({ 
      status: "Accept", 
      expectedPaymentDays: { $ne: null } 
    });

    for (const order of acceptedOrders) {
      // Find the corresponding inquiry to get expectedDelivery
      const inquiry = await Inquiry.findOne({ inquiryId: order.inquiryId });
      
      if (inquiry && inquiry.expectedDelivery && !isNaN(new Date(inquiry.expectedDelivery))) {
        const deliveryDate = new Date(inquiry.expectedDelivery);
        const dueDate = new Date(
          deliveryDate.getTime() + order.expectedPaymentDays * 24 * 60 * 60 * 1000
        );

        // DEBUG LOGS
        console.log(`Order ${order._id} - Inquiry: ${inquiry.inquiryId}`);
        console.log(`Delivery: ${inquiry.expectedDelivery}, PaymentDays: ${order.expectedPaymentDays}`);
        console.log(`Due Date: ${dueDate}, Today: ${today}`);

        // Normalize dates to remove time component
        const normalizeDate = (date) => {
          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };

        const normalizedToday = normalizeDate(today);
        const normalizedDueDate = normalizeDate(dueDate);

        if (normalizedToday > normalizedDueDate) {
          delayedActions.push({
            type: "Payment Reminder",
            orderId: order._id, // Using MongoDB _id instead of orderId
            inquiryId: inquiry.inquiryId,
            message: `Payment reminder: Expected payment was due on ${dueDate.toDateString()} for Inquiry ${inquiry.inquiryId}`,
            dueDate: dueDate,
            daysPastDue: Math.floor((normalizedToday - normalizedDueDate) / (24 * 60 * 60 * 1000))
          });
        }
      }
    }

    res.json(delayedActions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch delayed actions" });
  }
});

export default router;