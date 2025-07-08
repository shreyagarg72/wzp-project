import express from "express";
import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const router = express.Router();
let autoProductId = 3001; // can be persisted if needed

// Helper function to normalize strings for comparison
const normalizeString = (str) => {
  return str ? str.trim().toLowerCase() : '';
};

// Create new inquiry
router.post("/", async (req, res) => {
  try {
    console.log("=== DEBUGGING INQUIRY CREATION ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { inquiryId, customerId, expectedDelivery, products } = req.body;
    
    // Debug the extracted values
    console.log("Extracted values:");
    console.log("inquiryId:", inquiryId);
    console.log("customerId:", customerId, "Type:", typeof customerId);
    console.log("expectedDelivery:", expectedDelivery);
    console.log("products:", products);
    
    // Add validation before processing
    if (!inquiryId || !customerId || !products || products.length === 0) {
      console.log("❌ Validation failed - missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate customerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      console.log("❌ Invalid customerId format:", customerId);
      return res.status(400).json({ error: "Invalid customer ID format" });
    }

    console.log("✅ Validation passed, processing products...");

    const inquiryProducts = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      console.log(`\n--- Processing product ${i + 1} ---`);
      console.log("Product data:", p);
      
      // Validate required product fields
      if (!p.name || !p.quantity) {
        console.log("❌ Missing required product fields (name or quantity)");
        return res.status(400).json({ error: `Product ${i + 1} missing required fields` });
      }

      // Check if product with same name+brand+category+specifications+uom exists (case-insensitive)
      const query = {
        productName: { $regex: new RegExp(`^${p.name.trim()}$`, 'i') },
        brand: { $regex: new RegExp(`^${(p.brand || '').trim()}$`, 'i') },
        category: { $regex: new RegExp(`^${(p.category || '').trim()}$`, 'i') },
        specifications: { $regex: new RegExp(`^${(p.specifications || '').trim()}$`, 'i') },
        uom: { $regex: new RegExp(`^${(p.uom || '').trim()}$`, 'i') }
      };
      
      console.log("Product search query:", query);
      
      let existing = await Product.findOne(query);
      console.log("Existing product found:", existing ? "YES" : "NO");

      if (!existing) {
        console.log("Creating new product...");
        try {
          existing = await Product.create({
            productId: autoProductId++,
            productName: p.name.trim(),
            brand: (p.brand || '').trim(),
            category: (p.category || '').trim(),
            description: (p.description || '').trim(),
            specifications: (p.specifications || '').trim(),
            uom: (p.uom || '').trim(),
            inquiryId: [inquiryId], // Make it an array as requested
          });
          console.log("✅ Product created successfully:", existing._id);
        } catch (productError) {
          console.log("❌ Error creating product:", productError);
          throw productError;
        }
      } else {
        console.log("Updating existing product with inquiryId...");
        // Update existing product to add this inquiryId if not already present
        if (!existing.inquiryId.includes(inquiryId)) {
          existing.inquiryId.push(inquiryId);
          await existing.save();
          console.log("✅ Product updated with new inquiryId");
        } else {
          console.log("InquiryId already exists in product");
        }
      }

      const productLine = {
        productId: existing._id,
        name: p.name.trim(),
        brand: (p.brand || '').trim(),
        quantity: Number(p.quantity),
        category: (p.category || '').trim(),
        description: (p.description || '').trim(),
        specifications: (p.specifications || '').trim(),
        uom: (p.uom || '').trim(),
      };
      
      console.log("Product line to add:", productLine);
      inquiryProducts.push(productLine);
    }

    console.log("\n=== CREATING INQUIRY ===");
    const inquiryData = {
      inquiryId,
      customerId: new mongoose.Types.ObjectId(customerId), // Ensure it's properly converted
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      products: inquiryProducts,
    };
    
    console.log("Inquiry data to create:", JSON.stringify(inquiryData, null, 2));

    try {
      const newInquiry = await Inquiry.create(inquiryData);
      console.log("✅ Inquiry created successfully:", newInquiry._id);
      
      // Verify data was saved by fetching it back
      const savedInquiry = await Inquiry.findById(newInquiry._id).populate('customerId');
      console.log("Verified saved inquiry:", savedInquiry);
      
      res.status(201).json(newInquiry);
    } catch (inquiryError) {
      console.log("❌ Error creating inquiry:", inquiryError);
      throw inquiryError;
    }

  } catch (error) {
    console.error("❌ FINAL ERROR:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to create inquiry", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;