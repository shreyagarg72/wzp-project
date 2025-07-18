// routes/admin.js
import express from 'express';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js'; // Assuming this model exists


const router = express.Router();

router.get('/dashboard-stats', async (req, res) => {
  try {
    const orders = await Order.find();
    console.log(orders);
    const acceptedOrders = await Order.find({ status: 'Accept' });
console.log(acceptedOrders);
const totalRevenue = acceptedOrders.reduce((sum, order) => sum + order.totalPrice, 0);


    // Total Orders
    const totalOrders = orders.length;

    // Active Customers
    const customers = await Customer.find();
    const activeCustomers = customers.filter(c => c.status === 'Active').length;

    // Pending Quotes
    const pendingQuotes = orders.filter(order => order.status === 'Open' || order.status === 'Sent').length;

    res.json({
      totalRevenue,
      totalOrders,
      activeCustomers,
      pendingQuotes
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
