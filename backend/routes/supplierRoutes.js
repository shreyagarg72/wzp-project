import express from 'express';
import Supplier from '../models/Supplier.js'; // adjust the path if needed

const router = express.Router();

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

    const newSupplier = new Supplier({
      companyName,
      supplierName,
      email,
      mobile,
      address,
      gstin,
      specialization: Array.isArray(specialization) ? specialization : [],
      inquirySent: [] // initialize empty
    });

    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) {
    console.error('Error adding supplier:', err);
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

export default router;
