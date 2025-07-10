import express from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import { logActivity } from '../utils/logActivity.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('Received customer data:', req.body);

    // ✅ Get token from Authorization header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // ✅ Decode token to get user ID
    let decodedUser;
    try {
      decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Generate new custId
    const latest = await Customer.findOne().sort({ custId: -1 });
    const newCustId = latest ? latest.custId + 1 : 10001;

    // ✅ Create new customer
    const customer = new Customer({
      ...req.body,
      custId: newCustId,
    });

    await customer.save();

    // ✅ Log activity (without middleware)
    await logActivity({
      userId: decodedUser.id,
      action: "Created Customer",
      targetType: "Customer",
      targetId: customer._id,
      details: {
        name: customer.name,
        custId: customer.custId,
        email: customer.email
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      message: 'Failed to create customer',
      error: error.message
    });
  }
});


// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ custId: -1 });
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch customers',
      error: error.message 
    });
  }
});


export default router;
