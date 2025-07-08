import express from 'express';
import Customer from '../models/Customer.js';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('Received customer data:', req.body);
    
    // Find the latest customer to generate next custId
    const latest = await Customer.findOne().sort({ custId: -1 });
    const newCustId = latest ? latest.custId + 1 : 10001;
    
    // Create new customer
    const customer = new Customer({ 
      ...req.body, 
      custId: newCustId 
    });
    
    await customer.save();
    console.log('Customer saved successfully:', customer);
    
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
