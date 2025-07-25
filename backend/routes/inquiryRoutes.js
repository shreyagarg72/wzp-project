import express from "express";
import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/logActivity.js";
const router = express.Router();
// Remove this line completely
// let autoProductId = 3001; // ❌ DELETE THIS

// Helper function to normalize strings for comparison
const normalizeString = (str) => {
  return str ? str.trim().toLowerCase() : '';
};


// Get completed inquiries (existing route)
router.get('/completed', async (req, res) => {
  try {
    console.log('Fetching completed inquiries...');

    const inquiries = await Inquiry.find({ status: 'Completed' })
      .populate('customerId', 'companyName email phone address gstin') // Added more fields
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

// Get fulfilled inquiries (new route)
router.get('/fulfilled', async (req, res) => {
  try {
    console.log('Fetching fulfilled inquiries...');

    const inquiries = await Inquiry.find({ status: 'Fulfilled' })
      .populate('customerId', 'companyName email phone address gstin')
      .populate('supplierQuotes.supplierId')
      .populate('orderId') // If you want to include order details
      .lean();

    // Format response similar to completed inquiries
    const formatted = inquiries.map(inquiry => ({
      ...inquiry,
      customer: inquiry.customerId,
      customerId: undefined
    }));

    console.log(`Found ${formatted.length} fulfilled inquiries`);
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching fulfilled inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch fulfilled inquiries' });
  }
});

// Create new inquiry
router.post("/", async (req, res) => {
  try {
    // ✅ Extract token manually from header
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decodedUser;
    try {
      decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ✅ Parse request data
    const { inquiryId, customerId, expectedDelivery, products } = req.body;

    if (!inquiryId || !customerId || !products || products.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }

    const inquiryProducts = [];

    for (const p of products) {
      if (!p.name || !p.quantity) {
        return res.status(400).json({ error: `Missing fields in product` });
      }

      const query = {
        productName: { $regex: new RegExp(`^${p.name.trim()}$`, 'i') },
        brand: { $regex: new RegExp(`^${(p.brand || '').trim()}$`, 'i') },
        category: { $regex: new RegExp(`^${(p.category || '').trim()}$`, 'i') },
        specifications: { $regex: new RegExp(`^${(p.specifications || '').trim()}$`, 'i') },
        uom: { $regex: new RegExp(`^${(p.uom || '').trim()}$`, 'i') }
      };

      let existing = await Product.findOne(query);

      if (!existing) {
        // ✅ Let the schema handle productId generation
        existing = await Product.create({
          // ❌ Remove this line: productId: autoProductId++,
          productName: p.name.trim(),
          brand: (p.brand || '').trim(),
          category: (p.category || '').trim(),
          description: (p.description || '').trim(),
          specifications: (p.specifications || '').trim(),
          uom: (p.uom || '').trim(),
          inquiryId: [inquiryId],
        });
        
        console.log('✅ Created new product with ID:', existing.productId);
      } else {
        if (!existing.inquiryId.includes(inquiryId)) {
          existing.inquiryId.push(inquiryId);
          await existing.save();
        }
      }

      inquiryProducts.push({
        productId: existing._id,
        name: p.name.trim(),
        brand: (p.brand || '').trim(),
        quantity: Number(p.quantity),
        category: (p.category || '').trim(),
        description: (p.description || '').trim(),
        specifications: (p.specifications || '').trim(),
        uom: (p.uom || '').trim(),
      });
    }

    const inquiryData = {
      inquiryId,
      customerId: new mongoose.Types.ObjectId(customerId),
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      products: inquiryProducts,
    };

    const newInquiry = await Inquiry.create(inquiryData);

    // ✅ Log activity (like you did in customer)
    await logActivity({
      userId: decodedUser.id,
      action: "Created Inquiry",
      targetType: "Inquiry",
      targetId: newInquiry._id,
      details: {
        inquiryId: newInquiry.inquiryId,
        customerId: newInquiry.customerId.toString(),
        productCount: newInquiry.products.length
      }
    });

    res.status(201).json(newInquiry);
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({
      error: "Failed to create inquiry",
      details: error.message
    });
  }
});


// routes/inquiry.js
router.get('/', async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('customerId', 'companyName') // Get companyName from Customer
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/update-quotes/:inquiryId', async (req, res) => {
  const { inquiryId } = req.params;
  const { supplierId, quotes } = req.body;

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
    const inquiry = await Inquiry.findOne({ inquiryId });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const supplierQuoteIndex = inquiry.supplierQuotes.findIndex(
      (sq) => sq.supplierId.toString() === supplierId
    );

    if (supplierQuoteIndex !== -1) {
      const existingQuotes = inquiry.supplierQuotes[supplierQuoteIndex].quotes;

      quotes.forEach(newQuote => {
        const existingQuoteIndex = existingQuotes.findIndex(
          eq => eq.productId === newQuote.productId
        );
        if (existingQuoteIndex !== -1) {
          existingQuotes[existingQuoteIndex] = {
            ...existingQuotes[existingQuoteIndex],
            ...newQuote
          };
        } else {
          existingQuotes.push(newQuote);
        }
      });
    } else {
      inquiry.supplierQuotes.push({ supplierId, quotes });
    }

    await inquiry.save();

    // ✅ Log activity
    await logActivity({
      userId: decodedUser.id,
      action: "Updated Supplier Quote",
      targetType: "Inquiry",
      targetId: inquiry._id,
      details: {
        inquiryId: inquiry.inquiryId,
        supplierId,
        updatedProducts: quotes.map((q) => q.productId),
      }
    });

    res.json({ message: 'Quotes updated successfully', inquiry });
  } catch (err) {
    console.error('Update quotes error:', err);
    res.status(500).json({ error: 'Failed to update quotes' });
  }
});

// PATCH /api/inquiries/finalize/:inquiryId
router.patch('/finalize/:inquiryId', async (req, res) => {
  const { inquiryId } = req.params;

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
    const inquiry = await Inquiry.findOne({ inquiryId });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    inquiry.status = 'Completed';
    await inquiry.save();

    // ✅ Log activity
    await logActivity({
      userId: decodedUser.id,
      action: "Finalized Inquiry",
      targetType: "Inquiry",
      targetId: inquiry._id,
      details: {
        inquiryId: inquiry.inquiryId,
        status: "Completed",
      }
    });

    res.json({ message: 'Inquiry finalized', status: inquiry.status });
  } catch (err) {
    console.error('Finalize error:', err);
    res.status(500).json({ error: 'Failed to finalize inquiry' });
  }
});

// GET /api/inquiries/:inquiryId
router.get('/:inquiryId', async (req, res) => {
  const { inquiryId } = req.params;
  
  try {
    const inquiry = await Inquiry.findOne({ inquiryId })
      .populate('customerId')
      .populate('supplierQuotes.supplierId');
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json(inquiry);
  } catch (err) {
    console.error('Get inquiry error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});


export default router;