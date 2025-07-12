import express from "express";
import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/logActivity.js";
const router = express.Router();


router.get('/', async (req, res) => {
  try {
    console.log('Fetching completed inquiries...');

    const inquiries = await Inquiry.find({ status: 'Completed' })
      .populate('customerId', 'companyName') // only fetch companyName
      .populate('supplierQuotes.supplierId')
      .lean();

    // Optional: Rename customerId to customer for cleaner frontend use
    const formatted = inquiries.map(inquiry => ({
      ...inquiry,
      customer: inquiry.customerId,
      customerId: undefined
    }));

    console.log(`Found ${formatted.length} completed inquiries`);
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching completed inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch completed inquiries' });
  }
});

router.get('/test', (req, res) => {
  res.json({ message: 'Inquiry routes are working!' });
});
export default router;