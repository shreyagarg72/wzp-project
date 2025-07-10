import express from 'express';
import Supplier from '../models/Supplier.js'; // adjust the path if needed
import jwt from 'jsonwebtoken';
import { logActivity } from '../utils/logActivity.js';

const router = express.Router();

// Helper function to get next supplier ID
const getNextSupplierId = async () => {
  const lastSupplier = await Supplier.findOne().sort({ supplierId: -1 });
  return lastSupplier ? lastSupplier.supplierId + 1 : 401;
};

// 📌 Route: Add new supplier
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      supplierName,
      email,
      mobile,
      address,
      gstin,
      specialization
    } = req.body;

    // ✅ Step 1: Authorization token check
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decodedUser;
    try {
      decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Step 2: Validate required fields
    if (!companyName || !supplierName || !email || !mobile) {
      return res.status(400).json({ 
        message: 'Missing required fields: companyName, supplierName, email, mobile' 
      });
    }

    // ✅ Step 3: Get the next supplier ID
    const nextSupplierId = await getNextSupplierId();

    const newSupplier = new Supplier({
      supplierId: nextSupplierId,
      companyName,
      supplierName,
      email,
      mobile,
      address,
      gstin,
      specialization: Array.isArray(specialization) ? specialization : [],
      inquirySent: []
    });

    await newSupplier.save();

    // ✅ Step 4: Log activity
    await logActivity({
      userId: decodedUser.id,
      action: 'Created Supplier',
      targetType: 'Supplier',
      targetId: newSupplier._id,
      details: {
        supplierId: newSupplier.supplierId,
        supplierName: newSupplier.supplierName,
        email: newSupplier.email
      }
    });

    res.status(201).json(newSupplier);
  } catch (err) {
    console.error('Error adding supplier:', err);

    if (err.code === 11000) {
      if (err.keyPattern?.supplierId) {
        return res.status(409).json({ message: 'Supplier ID already exists. Please try again.' });
      }
      if (err.keyPattern?.email) {
        return res.status(409).json({ message: 'Email already exists. Please use a different email.' });
      }
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.message });
    }

    res.status(500).json({ message: 'Failed to add supplier' });
  }
});


// 📌 Route: Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ message: 'Failed to fetch suppliers' });
  }
});

// 📌 Route: Get next available supplier ID (for debugging)
router.get('/next-id', async (req, res) => {
  try {
    const nextId = await getNextSupplierId();
    res.json({ nextId });
  } catch (err) {
    console.error('Error getting next ID:', err);
    res.status(500).json({ message: 'Failed to get next ID' });
  }
});

export default router;