// routes/admin.js
import express from "express";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js"; // Assuming this model exists
import User from "../models/User.js";
//import Inquiry from "../models/Inquiry.js";
import ExcelJS from "exceljs";
import ActivityLog from "../models/ActivityLog.js";
import Product from "../models/Product.js";
//import Customer from '../models/Customer.js';
import Inquiry from "../models/Inquiry.js";
//import Order from '../models/Order.js';
//import ActivityLog from '../models/ActivityLog.js';
import Supplier from "../models/Supplier.js"; // Assuming you have this model
// Import notification manager
import { notificationManager } from "../utils/notifications.js";
import mongoose from "mongoose";
const router = express.Router();

router.get("/analytics/dashboard", async (req, res) => {
  try {
    const [
      totalOrders,
      activeCustomers,
      pendingInquiries,
      recentActivities,
      overdueInquiries,
    ] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments({ status: "active" }),
      Inquiry.countDocuments({ status: { $in: ["Open", "Processing"] } }),
      ActivityLog.find()
        .populate("user", "name email")
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      Inquiry.find({
        status: "Processing",
        createdAt: { $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      }).countDocuments(),
    ]);

    // Product availability analysis
    const inquiries = await Inquiry.find()
      .populate("supplierQuotes.supplierId")
      .lean();

    let totalProductsRequested = 0;
    let availableProducts = 0;
    let unavailableProducts = 0;
    const unavailableProductDetails = [];

    // Track product status by productId to avoid duplicates
    const productStatusMap = new Map();
    
    console.log(`Processing ${inquiries.length} inquiries for product availability analysis...`);

    for (const inquiry of inquiries) {
      const productIds = inquiry.products
        .map((p) => p.productId?.toString())
        .filter(Boolean);

      const products = await Product.find({ _id: { $in: productIds } }).lean();

      for (const inquiryProduct of inquiry.products) {
        const productIdStr = inquiryProduct.productId?.toString();
        if (!productIdStr) continue;

        // Only count unique product IDs
        if (productStatusMap.has(productIdStr)) {
          continue; // Already processed
        }

        totalProductsRequested++;

        const productInDb = products.find(
          (p) => p._id.toString() === productIdStr
        );
        
        if (!productInDb) {
          unavailableProducts++;
          productStatusMap.set(productIdStr, "unavailable");

          unavailableProductDetails.push({
            inquiryId: inquiry.inquiryId,
            productName: inquiryProduct.name,
            brand: inquiryProduct.brand,
            reason: "Product not found in database",
          });

          continue;
        }

        // Check if inquiry was sent to any supplier for this product
        const wasInquirySentToAnySupplier = await Supplier.exists({
          inquirySent: {
            $elemMatch: {
              inquiryId: inquiry.inquiryId,
              productIds: new mongoose.Types.ObjectId(inquiryProduct.productId),
            },
          },
        });

        // If inquiry was never sent to suppliers, skip this product entirely
        if (!wasInquirySentToAnySupplier) {
          console.log(`Product ${productIdStr} (${inquiryProduct.name}) - No inquiry sent to suppliers, skipping...`);
          totalProductsRequested--; // Don't count products that haven't been processed yet
          continue;
        }

        // Check if we have supplier quotes for this inquiry
        const hasSupplierQuotes = inquiry.supplierQuotes && inquiry.supplierQuotes.length > 0;

        if (!hasSupplierQuotes) {
          // Inquiry was sent to suppliers but no quotes received yet - this is pending, not unavailable
          console.log(`Product ${productIdStr} (${inquiryProduct.name}) - Inquiry sent but no quotes yet, skipping...`);
          totalProductsRequested--; // Don't count pending responses in final tally
          continue;
        }

        // Now check the actual quotes
        let hasSupplierResponse = false;
        let isProductAvailable = false;
        let hasValidQuote = false;

        inquiry.supplierQuotes.forEach((supplierQuote) => {
          const quote = supplierQuote.quotes.find(
            (q) => q.productId === productIdStr
          );

          if (quote) {
            hasSupplierResponse = true;
            hasValidQuote = true;
            
            // Check if product is available based on quote
            const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
            const hasValidAvailability = quote.availability && 
              !["no", "out of stock", "not available", "unavailable"].includes(
                quote.availability.toLowerCase().trim()
              );

            if (hasValidPrice && hasValidAvailability) {
              isProductAvailable = true;
            }
          }
        });

        if (!hasValidQuote) {
          // Inquiry was sent to suppliers and quotes exist, but no quote for this specific product
          unavailableProducts++;
          productStatusMap.set(productIdStr, "unavailable");
          console.log(`Product ${productIdStr} (${inquiryProduct.name}) - No specific quote received`);

          unavailableProductDetails.push({
            inquiryId: inquiry.inquiryId,
            productName: inquiryProduct.name,
            brand: inquiryProduct.brand,
            reason: "No quote received for this product from any supplier",
          });
        } else if (isProductAvailable) {
          availableProducts++;
          productStatusMap.set(productIdStr, "available");
          console.log(`Product ${productIdStr} (${inquiryProduct.name}) - Available`);
        } else {
          unavailableProducts++;
          productStatusMap.set(productIdStr, "unavailable");
          console.log(`Product ${productIdStr} (${inquiryProduct.name}) - Unavailable due to supplier response`);

          // Determine the specific reason for unavailability
          let reason = "Product unavailable";
          
          // Check what went wrong in the quotes
          const problemQuotes = [];
          inquiry.supplierQuotes.forEach((supplierQuote) => {
            const quote = supplierQuote.quotes.find(q => q.productId === productIdStr);
            if (quote) {
              if (quote.price === null || quote.price === undefined || quote.price <= 0) {
                problemQuotes.push("invalid/zero price");
              }
              if (!quote.availability || ["no", "out of stock", "not available", "unavailable"].includes(quote.availability.toLowerCase().trim())) {
                problemQuotes.push("marked as unavailable");
              }
            }
          });

          if (problemQuotes.length > 0) {
            reason = `Supplier response: ${[...new Set(problemQuotes)].join(" and ")}`;
          }

          unavailableProductDetails.push({
            inquiryId: inquiry.inquiryId,
            productName: inquiryProduct.name,
            brand: inquiryProduct.brand,
            reason: reason,
          });
        }
      }
    }

    const formattedActivities = recentActivities.map((activity) => ({
      action: activity.action,
      user: activity.user?.name || "Unknown User",
      timestamp: activity.timestamp,
      details: activity.details,
    }));

    console.log("=== PRODUCT AVAILABILITY SUMMARY ===");
    console.log(`Total products in inquiries: ${totalProductsRequested}`);
    console.log(`Available products: ${availableProducts}`);
    console.log(`Unavailable products: ${unavailableProducts}`);
    console.log(`Sum check: ${availableProducts + unavailableProducts}`);
    console.log(`Products with 19 total in schema - this analysis covers products that have been inquired about`);
    console.log("=====================================");

    res.json({
      totalOrders,
      activeCustomers,
      pendingInquiries,
      overdueActions: overdueInquiries,
      recentActivities: formattedActivities,
      productAnalysis: {
        available: availableProducts,
        unavailable: unavailableProducts,
        total: totalProductsRequested,
        availabilityRate:
          totalProductsRequested > 0
            ? ((availableProducts / totalProductsRequested) * 100).toFixed(2) +
              "%"
            : "0%",
        unavailableDetails: unavailableProductDetails.slice(0, 50), // Show up to 50 unavailable products
      },
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});
// New API endpoints for user activities

// 1. Get all users with their activity counts
router.get("/analytics/users", async (req, res) => {
  try {
    const users = await User.find({
      type: { $in: ["admin", "company_member"] },
    })
      .select("userId username email type")
      .lean();

    // Get activity counts for each user
    const usersWithActivityCounts = await Promise.all(
      users.map(async (user) => {
        const activityCount = await ActivityLog.countDocuments({
          user: user._id,
        });
        const recentActivityCount = await ActivityLog.countDocuments({
          user: user._id,
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        });

        return {
          ...user,
          totalActivities: activityCount,
          recentActivities: recentActivityCount,
        };
      })
    );

    res.json(usersWithActivityCounts);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 2. Get activities by user with filtering
router.get("/analytics/user-activities/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1, dateFrom, dateTo } = req.query;

    // Build date filter
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.timestamp = {};
      if (dateFrom) dateFilter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.timestamp.$lte = new Date(dateTo);
    }

    const user = await User.findOne({ userId: parseInt(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const activities = await ActivityLog.find({
      user: user._id,
      ...dateFilter,
    })
      .populate("user", "username email")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalActivities = await ActivityLog.countDocuments({
      user: user._id,
      ...dateFilter,
    });

    const formattedActivities = activities.map((activity) => ({
      _id: activity._id,
      action: activity.action,
      targetType: activity.targetType,
      targetId: activity.targetId,
      details: activity.details,
      timestamp: activity.timestamp,
      user: activity.user,
    }));

    res.json({
      activities: formattedActivities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        limit: parseInt(limit),
      },
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    res.status(500).json({ error: "Failed to fetch user activities" });
  }
});

// 3. Get performance statistics for all users
router.get("/analytics/user-performance", async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current month if not provided
    const targetDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : targetDate.getMonth();
    const targetYear = year ? parseInt(year) : targetDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    // Get all users
    const users = await User.find({
      type: { $in: ["admin", "company_member"] },
    })
      .select("userId username email type")
      .lean();

    // Get activity statistics for each user
    const userPerformance = await Promise.all(
      users.map(async (user) => {
        const activities = await ActivityLog.find({
          user: user._id,
          timestamp: { $gte: startDate, $lte: endDate },
        }).lean();

        // Categorize activities
        const activityTypes = {};
        activities.forEach((activity) => {
          activityTypes[activity.action] =
            (activityTypes[activity.action] || 0) + 1;
        });

        return {
          user: {
            userId: user.userId,
            username: user.username,
            email: user.email,
            type: user.type,
          },
          totalActivities: activities.length,
          activityBreakdown: activityTypes,
          averageActivitiesPerDay: (
            activities.length /
            new Date(targetYear, targetMonth + 1, 0).getDate()
          ).toFixed(2),
        };
      })
    );

    // Sort by total activities (best performing first)
    userPerformance.sort((a, b) => b.totalActivities - a.totalActivities);

    res.json({
      period: {
        month: targetMonth + 1,
        year: targetYear,
        monthName: new Date(targetYear, targetMonth).toLocaleString("default", {
          month: "long",
        }),
      },
      userPerformance,
      summary: {
        totalUsers: users.length,
        totalActivities: userPerformance.reduce(
          (sum, user) => sum + user.totalActivities,
          0
        ),
        averageActivitiesPerUser: (
          userPerformance.reduce((sum, user) => sum + user.totalActivities, 0) /
          users.length
        ).toFixed(2),
        mostActiveUser: userPerformance[0]?.user.username || "None",
      },
    });
  } catch (error) {
    console.error("Error fetching user performance:", error);
    res.status(500).json({ error: "Failed to fetch user performance data" });
  }
});

// 4. Export user activities to Excel
router.get("/analytics/export/user-activities", async (req, res) => {
  try {
    const { userId, dateFrom, dateTo } = req.query;

    let userFilter = {};
    if (userId) {
      const user = await User.findOne({ userId: parseInt(userId) });
      if (user) {
        userFilter = { user: user._id };
      }
    }

    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.timestamp = {};
      if (dateFrom) dateFilter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.timestamp.$lte = new Date(dateTo);
    }

    const activities = await ActivityLog.find({
      ...userFilter,
      ...dateFilter,
    })
      .populate("user", "username email userId")
      .sort({ timestamp: -1 })
      .lean();

    // Format data for Excel export
    const exportData = activities.map((activity) => ({
      "User ID": activity.user?.userId || "N/A",
      Username: activity.user?.username || "N/A",
      Email: activity.user?.email || "N/A",
      Action: activity.action,
      "Target Type": activity.targetType || "N/A",
      "Target ID": activity.targetId || "N/A",
      Details: JSON.stringify(activity.details || {}),
      Timestamp: new Date(activity.timestamp).toLocaleString(),
    }));

    // Set headers for Excel download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=user-activities-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    // You'll need to implement Excel generation here using a library like 'exceljs'
    // For now, returning JSON data
    res.json({
      message: "Export data prepared",
      data: exportData,
      count: exportData.length,
    });
  } catch (error) {
    console.error("Error exporting user activities:", error);
    res.status(500).json({ error: "Failed to export user activities" });
  }
});

// Additional route to get detailed unavailable products report
// Notifications Route
router.get("/analytics/notifications", async (req, res) => {
  try {
    const notifications = [];
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    // Find overdue processing inquiries
    const overdueInquiries = await Inquiry.find({
      status: "Processing",
      createdAt: { $lt: tenDaysAgo },
    }).populate("customerId", "companyName customerName");

    overdueInquiries.forEach((inquiry) => {
      notifications.push({
        title: "Overdue Inquiry Processing",
        message: `Inquiry ${inquiry.inquiryId} from ${
          inquiry.customerId?.companyName || "Unknown Company"
        } has been in processing for over 10 days`,
        priority: "high",
        createdAt: inquiry.createdAt,
        type: "overdue_inquiry",
        inquiryId: inquiry.inquiryId,
      });
    });

    // Find orders sent 10 days ago without response
    const oldOrders = await Order.find({
      status: "Sent",
      createdAt: { $lt: tenDaysAgo },
    });

    for (const order of oldOrders) {
      const inquiry = await Inquiry.findOne({
        inquiryId: order.inquiryId,
      }).populate("customerId");
      if (inquiry) {
        notifications.push({
          title: "Order Awaiting Response",
          message: `Quote ${order.orderId} sent to ${
            inquiry.customerId?.companyName || "Unknown Company"
          } 10 days ago without response`,
          priority: "medium",
          createdAt: order.createdAt,
          type: "pending_response",
          orderId: order.orderId,
        });
      }
    }

    // Find products with no supplier quotes
    const inquiriesWithoutQuotes = await Inquiry.find({
      $or: [
        { supplierQuotes: { $size: 0 } },
        { supplierQuotes: { $exists: false } },
      ],
      status: { $in: ["Open", "Processing"] },
    }).populate("customerId");

    inquiriesWithoutQuotes.forEach((inquiry) => {
      notifications.push({
        title: "Missing Supplier Quotes",
        message: `Inquiry ${inquiry.inquiryId} from ${
          inquiry.customerId?.companyName || "Unknown Company"
        } has no supplier quotes`,
        priority: "medium",
        createdAt: inquiry.createdAt,
        type: "missing_quotes",
        inquiryId: inquiry.inquiryId,
      });
    });

    // Sort notifications by priority and date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Excel Export Route
router.get("/analytics/export-excel", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Order Analysis
    const orderSheet = workbook.addWorksheet("Order Analysis");
    orderSheet.columns = [
      { header: "Order ID", key: "orderId", width: 15 },
      { header: "Inquiry ID", key: "inquiryId", width: 15 },
      { header: "Customer Name", key: "customerName", width: 20 },
      { header: "Company", key: "companyName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile", key: "mobile", width: 15 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Brand", key: "brand", width: 20 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Base Price", key: "basePrice", width: 12 },
      { header: "Final Price", key: "finalPrice", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Order Date", key: "orderDate", width: 15 },
      { header: "Supplier Found", key: "supplierFound", width: 15 },
    ];

    const orders = await Order.find().lean();

    for (const order of orders) {
      const inquiry = await Inquiry.findOne({ inquiryId: order.inquiryId })
        .populate("customerId")
        .lean();

      order.items.forEach((item) => {
        const supplierFound = inquiry?.supplierQuotes?.some((sq) =>
          sq.quotes.some((quote) => quote.price > 0)
        )
          ? "Yes"
          : "No";

        orderSheet.addRow({
          orderId: order.orderId,
          inquiryId: order.inquiryId,
          customerName: inquiry?.customerId?.customerName || "N/A",
          companyName: inquiry?.customerId?.companyName || "N/A",
          email: inquiry?.customerId?.email || "N/A",
          mobile: inquiry?.customerId?.mobile || "N/A",
          productName: item.name,
          brand: item.brand,
          quantity: item.quantity,
          basePrice: item.basePrice || 0,
          finalPrice: item.finalPrice,
          status: order.status,
          orderDate: order.createdAt?.toISOString().split("T")[0] || "N/A",
          supplierFound: supplierFound,
        });
      });
    }

    // Sheet 2: Product Availability
    const productSheet = workbook.addWorksheet("Product Availability");
    productSheet.columns = [
      { header: "Inquiry ID", key: "inquiryId", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Brand", key: "brand", width: 20 },
      { header: "Quantity Requested", key: "quantity", width: 15 },
      { header: "Supplier Name", key: "supplierName", width: 25 },
      { header: "Supplier Price", key: "supplierPrice", width: 15 },
      { header: "Availability", key: "availability", width: 15 },
      { header: "Expected Delivery", key: "expectedDelivery", width: 15 },
    ];

    const inquiries = await Inquiry.find()
      .populate("customerId")
      .populate("supplierQuotes.supplierId")
      .lean();

    inquiries.forEach((inquiry) => {
      inquiry.products.forEach((product) => {
        if (inquiry.supplierQuotes && inquiry.supplierQuotes.length > 0) {
          inquiry.supplierQuotes.forEach((supplierQuote) => {
            const quote = supplierQuote.quotes.find(
              (q) => q.productId === product.productId?.toString()
            );

            productSheet.addRow({
              inquiryId: inquiry.inquiryId,
              customer: inquiry.customerId?.companyName || "N/A",
              productName: product.name,
              brand: product.brand,
              quantity: product.quantity,
              supplierName: supplierQuote.supplierId?.name || "N/A",
              supplierPrice: quote?.price || 0,
              availability: quote?.availability || "Not Available",
              expectedDelivery:
                quote?.expectedDelivery?.toISOString().split("T")[0] || "N/A",
            });
          });
        } else {
          productSheet.addRow({
            inquiryId: inquiry.inquiryId,
            customer: inquiry.customerId?.companyName || "N/A",
            productName: product.name,
            brand: product.brand,
            quantity: product.quantity,
            supplierName: "No Supplier",
            supplierPrice: 0,
            availability: "Not Found",
            expectedDelivery: "N/A",
          });
        }
      });
    });

    // Sheet 3: User Activity
    const activitySheet = workbook.addWorksheet("User Activity");
    activitySheet.columns = [
      { header: "User", key: "user", width: 20 },
      { header: "Action", key: "action", width: 30 },
      { header: "Target Type", key: "targetType", width: 15 },
      { header: "Target ID", key: "targetId", width: 15 },
      { header: "Details", key: "details", width: 40 },
      { header: "Timestamp", key: "timestamp", width: 20 },
    ];

    const activities = await ActivityLog.find()
      .populate("user", "username email")
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    activities.forEach((activity) => {
      activitySheet.addRow({
        user: activity.user?.username || "Unknown User",
        action: activity.action,
        targetType: activity.targetType || "N/A",
        targetId: activity.targetId?.toString() || "N/A",
        details:
          typeof activity.details === "object"
            ? JSON.stringify(activity.details)
            : activity.details || "N/A",
        timestamp: activity.timestamp?.toISOString() || "N/A",
      });
    });

    // Sheet 4: Overdue Actions
    const overdueSheet = workbook.addWorksheet("Overdue Actions");
    overdueSheet.columns = [
      { header: "Type", key: "type", width: 20 },
      { header: "ID", key: "id", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Days Overdue", key: "daysOverdue", width: 15 },
      { header: "Created Date", key: "createdDate", width: 15 },
      { header: "Last Updated", key: "lastUpdated", width: 15 },
    ];

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    // Overdue inquiries
    const overdueInquiries = await Inquiry.find({
      status: "Processing",
      createdAt: { $lt: tenDaysAgo },
    })
      .populate("customerId")
      .lean();

    overdueInquiries.forEach((inquiry) => {
      const daysOverdue = Math.floor(
        (now - inquiry.createdAt) / (1000 * 60 * 60 * 24)
      );
      overdueSheet.addRow({
        type: "Inquiry",
        id: inquiry.inquiryId,
        customer: inquiry.customerId?.companyName || "N/A",
        status: inquiry.status,
        daysOverdue: daysOverdue,
        createdDate: inquiry.createdAt?.toISOString().split("T")[0] || "N/A",
        lastUpdated: inquiry.updatedAt?.toISOString().split("T")[0] || "N/A",
      });
    });

    // Overdue orders
    const overdueOrders = await Order.find({
      status: "Sent",
      createdAt: { $lt: tenDaysAgo },
    }).lean();

    for (const order of overdueOrders) {
      const inquiry = await Inquiry.findOne({ inquiryId: order.inquiryId })
        .populate("customerId")
        .lean();

      const daysOverdue = Math.floor(
        (now - order.createdAt) / (1000 * 60 * 60 * 24)
      );
      overdueSheet.addRow({
        type: "Order",
        id: order.orderId,
        customer: inquiry?.customerId?.companyName || "N/A",
        status: order.status,
        daysOverdue: daysOverdue,
        createdDate: order.createdAt?.toISOString().split("T")[0] || "N/A",
        lastUpdated: order.updatedAt?.toISOString().split("T")[0] || "N/A",
      });
    }

    // Style headers
    [orderSheet, productSheet, activitySheet, overdueSheet].forEach((sheet) => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=analytics-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

// Notification scheduler (run this as a cron job)
export const checkAndCreateNotifications = async () => {
  return await notificationManager.runAllChecks();
};

// Get notification statistics
router.get("/analytics/notification-stats", async (req, res) => {
  try {
    const stats = await notificationManager.getNotificationStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({ error: "Failed to fetch notification stats" });
  }
});

// Mark notification as read
router.patch("/analytics/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await notificationManager.markNotificationAsRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});
router.get("/dashboard-stats", async (req, res) => {
  try {
    const orders = await Order.find();
    const acceptedOrders = orders.filter(order => order.status === "Accept");

    const totalRevenue = acceptedOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    const totalOrders = orders.length;

    // Get all inquiries
    const inquiries = await Inquiry.find();

    // Get inquiryId strings from orders with "Open" status
    const openOrders = orders.filter(order => order.status === "Open");
    const openInquiryIds = new Set(openOrders.map(order => order.inquiryId));

    // Count active inquiries based on business logic:
    // 1. Inquiries with status "Open" or "Processing" are always active
    // 2. Inquiries with status "Fulfilled" are active if they have an associated order with "Open" status
    // 3. Inquiries with status "Completed" without orders are NOT active
    const activeInquiries = inquiries.filter(inquiry => {
      if (inquiry.status === "Open" || inquiry.status === "Processing" || inquiry.status === "Completed") {
        return true;
      }
      if (inquiry.status === "Fulfilled" && openInquiryIds.has(inquiry.inquiryId)) {
        return true;
      }
      return false;
    });

    // Get unique customer IDs from active inquiries
    const activeCustomerIds = new Set(
      activeInquiries.map(inq => inq.customerId.toString())
    );

    const activeCustomers = activeCustomerIds.size;

    // Pending quotes should be orders with status "Open" or "Sent"
    const pendingQuotes = orders.filter(
      (order) => order.status === "Open" || order.status === "Negotiation"
    ).length;

    res.json({
      totalRevenue,
      totalOrders,
      activeCustomers,
      pendingQuotes,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});


// In routes/admin.js
router.get("/order-status-summary", async (req, res) => {
  try {
    const summary = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order status summary" });
  }
});
router.get("/weekly-inquiry-trend", async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Inquiry.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDayOfMonth },
        },
      },
      {
        $group: {
          _id: {
            $isoWeek: "$createdAt",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weekly inquiry data" });
  }
});
// GET /api/orders/recent
router.get("/orders/recent", async (req, res) => {
  try {
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const inquiryIds = recentOrders.map((order) => order.inquiryId);

    // Populate the customerId in inquiries to get company name
    const inquiries = await Inquiry.find({ inquiryId: { $in: inquiryIds } })
      .populate("customerId", "companyName")
      .lean();

    // Create a lookup map for company names
    const inquiryMap = {};
    inquiries.forEach((inquiry) => {
      inquiryMap[inquiry.inquiryId] = inquiry.customerId?.companyName || "N/A";
    });

    // Attach companyName to each order
    const enrichedOrders = recentOrders.map((order) => ({
      ...order,
      companyName: inquiryMap[order.inquiryId] || "Unknown",
    }));

    res.status(200).json(enrichedOrders);
  } catch (err) {
    console.error("Error fetching recent orders:", err);
    res.status(500).json({ error: "Failed to fetch recent orders" });
  }
});
// GET /api/admin/top-customers
router.get("/top-customers", async (req, res) => {
  try {
    const topCustomers = await Order.aggregate([
      {
        $lookup: {
          from: "inquiries",
          localField: "inquiryId",
          foreignField: "inquiryId",
          as: "inquiry",
        },
      },
      { $unwind: "$inquiry" },
      {
        $lookup: {
          from: "customers",
          localField: "inquiry.customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customer._id",
          companyName: { $first: "$customer.companyName" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json(topCustomers);
  } catch (err) {
    console.error("Error fetching top customers:", err);
    res.status(500).json({ error: "Failed to fetch top customers" });
  }
});

// GET /api/admin/orders/delayed-actions
router.get("/orders/delayed-actions", async (req, res) => {
  try {
    const currentDate = new Date();
    const delayThreshold = 3; // Orders older than 3 days are considered delayed

    // Calculate the date threshold (3 days ago)
    const thresholdDate = new Date();
    thresholdDate.setDate(currentDate.getDate() - delayThreshold);

    // Aggregation pipeline to find delayed orders by status
    const delayedOrders = await Order.aggregate([
      {
        // Match orders that are older than threshold and not completed
        $match: {
          createdAt: { $lt: thresholdDate },
          status: {
            $nin: ["Accept", "Decline", "Negotiated"], // Exclude final statuses
          },
        },
      },
      {
        // Add a field to calculate days since order creation
        $addFields: {
          daysSinceCreated: {
            $divide: [
              { $subtract: [currentDate, "$createdAt"] },
              1000 * 60 * 60 * 24, // Convert milliseconds to days
            ],
          },
        },
      },
      {
        // Group by status and calculate statistics
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgDays: { $avg: "$daysSinceCreated" },
          maxDays: { $max: "$daysSinceCreated" },
          minDays: { $min: "$daysSinceCreated" },
          orders: {
            $push: {
              orderId: "$_id",
              companyName: "$companyName",
              createdAt: "$createdAt",
              days: "$daysSinceCreated",
            },
          },
        },
      },
      {
        // Project the final structure
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
          avgDays: { $round: ["$avgDays", 1] },
          maxDays: { $round: ["$maxDays", 1] },
          minDays: { $round: ["$minDays", 1] },
          orders: 1,
        },
      },
      {
        // Sort by count (highest first) and then by avgDays (highest first)
        $sort: { count: -1, avgDays: -1 },
      },
    ]);

    // Alternative approach using simple find and JavaScript processing
    // This is more readable but less efficient for large datasets
    /*
    const delayedOrdersSimple = await Order.find({
      createdAt: { $lt: thresholdDate },
      status: { $nin: ['delivered', 'cancelled', 'completed'] }
    }).lean();

    // Group by status
    const statusGroups = {};
    delayedOrdersSimple.forEach(order => {
      const status = order.status;
      const daysSinceCreated = Math.floor((currentDate - order.createdAt) / (1000 * 60 * 60 * 24));
      
      if (!statusGroups[status]) {
        statusGroups[status] = {
          status,
          count: 0,
          totalDays: 0,
          maxDays: 0,
          minDays: Infinity,
          orders: []
        };
      }
      
      statusGroups[status].count++;
      statusGroups[status].totalDays += daysSinceCreated;
      statusGroups[status].maxDays = Math.max(statusGroups[status].maxDays, daysSinceCreated);
      statusGroups[status].minDays = Math.min(statusGroups[status].minDays, daysSinceCreated);
      statusGroups[status].orders.push({
        orderId: order._id,
        companyName: order.companyName,
        createdAt: order.createdAt,
        days: daysSinceCreated
      });
    });

    // Convert to array and calculate averages
    const delayedActions = Object.values(statusGroups).map(group => ({
      status: group.status,
      count: group.count,
      avgDays: Math.round((group.totalDays / group.count) * 10) / 10,
      maxDays: group.maxDays,
      minDays: group.minDays === Infinity ? 0 : group.minDays,
      orders: group.orders
    }));

    // Sort by count (highest first) and then by avgDays (highest first)
    delayedActions.sort((a, b) => b.count - a.count || b.avgDays - a.avgDays);
    */

    res.json(delayedOrders);
  } catch (error) {
    console.error("Error fetching delayed actions:", error);
    res.status(500).json({
      error: "Failed to fetch delayed actions",
      message: error.message,
    });
  }
});
router.get("/customer-segmentation", async (req, res) => {
  try {
    // Get all customers first
    const allCustomersFromDB = await Customer.find({});

    // Get inquiry counts for each customer
    const customerInquiryCounts = await Inquiry.aggregate([
      {
        $group: {
          _id: "$customerId",
          inquiryCount: { $sum: 1 },
          firstInquiry: { $min: "$createdAt" },
          lastInquiry: { $max: "$createdAt" },
        },
      },
    ]);

    // Create a map for quick lookup of inquiry counts
    const inquiryCountMap = {};
    customerInquiryCounts.forEach((item) => {
      inquiryCountMap[item._id.toString()] = {
        inquiryCount: item.inquiryCount,
        firstInquiry: item.firstInquiry,
        lastInquiry: item.lastInquiry,
      };
    });

    // Combine all customers with their inquiry counts
    const allCustomers = allCustomersFromDB.map((customer) => {
      const inquiryData = inquiryCountMap[customer._id.toString()] || {
        inquiryCount: 0,
        firstInquiry: null,
        lastInquiry: null,
      };

      return {
        customerId: customer._id,
        custId: customer.custId,
        companyName: customer.companyName,
        customerName: customer.customerName,
        email: customer.email,
        mobile: customer.mobile,
        status: customer.status,
        inquiryCount: inquiryData.inquiryCount,
        firstInquiry: inquiryData.firstInquiry,
        lastInquiry: inquiryData.lastInquiry,
      };
    });

    // Segment customers based on inquiry count
    const newCustomers = allCustomers.filter(
      (customer) => customer.inquiryCount <= 1
    );
    const repeatCustomers = allCustomers.filter(
      (customer) => customer.inquiryCount > 1
    );

    const totalCustomers = allCustomers.length;
    const newCustomerCount = newCustomers.length;
    const repeatCustomerCount = repeatCustomers.length;

    // Calculate percentages
    const newCustomerPercentage =
      totalCustomers > 0 ? (newCustomerCount / totalCustomers) * 100 : 0;
    const repeatCustomerPercentage =
      totalCustomers > 0 ? (repeatCustomerCount / totalCustomers) * 100 : 0;

    // Additional analytics
    const avgInquiriesPerCustomer =
      totalCustomers > 0
        ? allCustomers.reduce(
            (sum, customer) => sum + customer.inquiryCount,
            0
          ) / totalCustomers
        : 0;

    // Find top repeat customers
    const topRepeatCustomers = repeatCustomers
      .sort((a, b) => b.inquiryCount - a.inquiryCount)
      .slice(0, 5)
      .map((customer) => ({
        customerId: customer.customerId,
        custId: customer.custId,
        companyName: customer.companyName,
        customerName: customer.customerName,
        email: customer.email,
        mobile: customer.mobile,
        inquiryCount: customer.inquiryCount,
        firstInquiry: customer.firstInquiry,
        lastInquiry: customer.lastInquiry,
        daysSinceFirstInquiry: customer.firstInquiry
          ? Math.floor(
              (new Date() - new Date(customer.firstInquiry)) /
                (1000 * 60 * 60 * 24)
            )
          : null,
        daysSinceLastInquiry: customer.lastInquiry
          ? Math.floor(
              (new Date() - new Date(customer.lastInquiry)) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      }));

    // Customer retention insights - customers who came back for more inquiries
    const customerRetentionRate =
      totalCustomers > 0 ? (repeatCustomerCount / totalCustomers) * 100 : 0;

    // Calculate time-based insights (customers acquired in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNewCustomers = newCustomers.filter(
      (customer) =>
        customer.firstInquiry &&
        new Date(customer.firstInquiry) >= thirtyDaysAgo
    );

    // Calculate customers by activity level
    const veryActiveCustomers = allCustomers.filter(
      (c) => c.inquiryCount >= 5
    ).length;
    const moderateCustomers = allCustomers.filter(
      (c) => c.inquiryCount >= 3 && c.inquiryCount < 5
    ).length;

    // Calculate average days between inquiries for repeat customers
    const avgDaysBetweenInquiries =
      repeatCustomers.length > 0
        ? repeatCustomers.reduce((sum, customer) => {
            if (!customer.firstInquiry || !customer.lastInquiry) return sum;
            const daysBetween = Math.floor(
              (new Date(customer.lastInquiry) -
                new Date(customer.firstInquiry)) /
                (1000 * 60 * 60 * 24)
            );
            return sum + daysBetween / (customer.inquiryCount - 1);
          }, 0) / repeatCustomers.length
        : 0;

    const response = {
      // Main segmentation data - based on inquiry behavior, not status field
      newCustomers: newCustomerCount,
      repeatCustomers: repeatCustomerCount,
      totalCustomers: totalCustomers,
      newCustomerPercentage: Math.round(newCustomerPercentage * 10) / 10,
      repeatCustomerPercentage: Math.round(repeatCustomerPercentage * 10) / 10,

      // Additional insights
      avgInquiriesPerCustomer: Math.round(avgInquiriesPerCustomer * 10) / 10,
      customerRetentionRate: Math.round(customerRetentionRate * 10) / 10,
      recentNewCustomers: recentNewCustomers.length,
      avgDaysBetweenInquiries: Math.round(avgDaysBetweenInquiries * 10) / 10,

      // Customer activity levels
      veryActiveCustomers: veryActiveCustomers, // 5+ inquiries
      moderateCustomers: moderateCustomers, // 3-4 inquiries

      // Top repeat customers
      topRepeatCustomers: topRepeatCustomers,

      // Breakdown by inquiry count - more detailed segmentation
      inquiryCountBreakdown: {
        oneInquiry: newCustomerCount,
        twoInquiries: allCustomers.filter((c) => c.inquiryCount === 2).length,
        threeInquiries: allCustomers.filter((c) => c.inquiryCount === 3).length,
        fourInquiries: allCustomers.filter((c) => c.inquiryCount === 4).length,
        fivePlusInquiries: allCustomers.filter((c) => c.inquiryCount >= 5)
          .length,
      },

      // Customer lifecycle insights
      lifecycle: {
        newCustomers: {
          count: newCustomerCount,
          recentCount: recentNewCustomers.length,
          percentage: Math.round(newCustomerPercentage * 10) / 10,
        },
        returningCustomers: {
          count: repeatCustomerCount,
          percentage: Math.round(repeatCustomerPercentage * 10) / 10,
          avgInquiries:
            repeatCustomers.length > 0
              ? Math.round(
                  (repeatCustomers.reduce((sum, c) => sum + c.inquiryCount, 0) /
                    repeatCustomers.length) *
                    10
                ) / 10
              : 0,
        },
      },

      // Metadata
      lastUpdated: new Date(),
      totalInquiries: await Inquiry.countDocuments(),
      note: "Segmentation based on inquiry behavior - customers with ≤1 inquiry are 'new', >1 are 'repeat'",
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching customer segmentation:", error);
    res.status(500).json({
      error: "Failed to fetch customer segmentation data",
      message: error.message,
    });
  }
});
// Fixed backend route for top products
router.get("/top-products", async (req, res) => {
  try {
    const result = await Order.aggregate([
      // Only include orders that have items
      { $match: { items: { $exists: true, $not: { $size: 0 } } } },
      // Unwind the items array to work with individual items
      { $unwind: "$items" },
      // Group by product name and sum the quantities
      {
        $group: {
          _id: "$items.name", // Changed from productName to name
          totalQuantity: { $sum: "$items.quantity" },
          brand: { $first: "$items.brand" }, // Include brand info
          category: { $first: "$items.category" }, // Include category info
        },
      },
      // Sort by total quantity in descending order
      { $sort: { totalQuantity: -1 } },
      // Limit to top 10 products
      { $limit: 10 },
    ]);

    // Format the response to match frontend expectations
    const formattedResult = result.map((item) => ({
      _id: item._id,
      name: item._id,
      totalQuantity: item.totalQuantity,
      brand: item.brand,
      category: item.category,
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({
      error: "Failed to fetch top products.",
      details: error.message,
    });
  }
});
// Customer Lifetime Value API endpoint
router.get("/customer-lifetime-value", async (req, res) => {
  try {
    // Get all customers with their CLV
    const customerCLV = await Order.aggregate([
      {
        // Only include accepted orders for revenue calculation
        $match: {
          status: "Accept",
        },
      },
      {
        // Get customer info from inquiries
        $lookup: {
          from: "inquiries",
          localField: "inquiryId",
          foreignField: "inquiryId",
          as: "inquiry",
        },
      },
      {
        $unwind: "$inquiry",
      },
      {
        // Get customer details
        $lookup: {
          from: "customers",
          localField: "inquiry.customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: "$customer",
      },
      {
        // Group by customer to calculate CLV
        $group: {
          _id: "$customer._id",
          customerId: { $first: "$customer._id" },
          custId: { $first: "$customer.custId" },
          companyName: { $first: "$customer.companyName" },
          customerName: { $first: "$customer.customerName" },
          email: { $first: "$customer.email" },
          mobile: { $first: "$customer.mobile" },
          status: { $first: "$customer.status" },
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
          avgOrderValue: { $avg: "$totalPrice" },
        },
      },
      {
        // Add calculated fields
        $addFields: {
          customerLifetimeMonths: {
            $ceil: {
              $divide: [
                { $subtract: ["$$NOW", "$firstOrderDate"] },
                1000 * 60 * 60 * 24 * 30, // Convert to months
              ],
            },
          },
          daysSinceLastOrder: {
            $floor: {
              $divide: [
                { $subtract: ["$$NOW", "$lastOrderDate"] },
                1000 * 60 * 60 * 24, // Convert to days
              ],
            },
          },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Get all customers (including those with no orders) for complete picture
    const allCustomers = await Customer.find({});

    // Create a map of customers with CLV
    const clvMap = {};
    customerCLV.forEach((customer) => {
      clvMap[customer.customerId.toString()] = customer;
    });

    // Include customers with zero CLV
    const completeCustomerList = allCustomers.map((customer) => {
      const clvData = clvMap[customer._id.toString()];

      if (clvData) {
        return clvData;
      } else {
        // Customer with no accepted orders
        return {
          customerId: customer._id,
          custId: customer.custId,
          companyName: customer.companyName,
          customerName: customer.customerName,
          email: customer.email,
          mobile: customer.mobile,
          status: customer.status,
          totalRevenue: 0,
          totalOrders: 0,
          firstOrderDate: null,
          lastOrderDate: null,
          avgOrderValue: 0,
          customerLifetimeMonths: 0,
          daysSinceLastOrder: null,
        };
      }
    });

    // Sort by total revenue (CLV)
    completeCustomerList.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate summary statistics
    const totalRevenue = completeCustomerList.reduce(
      (sum, customer) => sum + customer.totalRevenue,
      0
    );
    const customersWithOrders = completeCustomerList.filter(
      (customer) => customer.totalOrders > 0
    );
    const avgCLV =
      customersWithOrders.length > 0
        ? totalRevenue / customersWithOrders.length
        : 0;
    const topCustomerRevenue =
      completeCustomerList.length > 0
        ? completeCustomerList[0].totalRevenue
        : 0;
    const topCustomerPercentage =
      totalRevenue > 0 ? (topCustomerRevenue / totalRevenue) * 100 : 0;

    // Get top 10 customers for detailed view
    const topCustomers = completeCustomerList.slice(0, 10).map((customer) => ({
      ...customer,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((customer.totalRevenue / totalRevenue) * 1000) / 10
          : 0,
    }));

    // CLV distribution analysis
    const clvRanges = {
      high: completeCustomerList.filter((c) => c.totalRevenue >= 100000).length, // >= 1L
      medium: completeCustomerList.filter(
        (c) => c.totalRevenue >= 50000 && c.totalRevenue < 100000
      ).length, // 50K-1L
      low: completeCustomerList.filter(
        (c) => c.totalRevenue >= 10000 && c.totalRevenue < 50000
      ).length, // 10K-50K
      minimal: completeCustomerList.filter(
        (c) => c.totalRevenue > 0 && c.totalRevenue < 10000
      ).length, // <10K
      zero: completeCustomerList.filter((c) => c.totalRevenue === 0).length, // No orders
    };

    const response = {
      // Main data
      customers: topCustomers,
      allCustomers: completeCustomerList,
      totalCustomers: completeCustomerList.length,

      // Summary statistics
      summary: {
        totalRevenue: Math.round(totalRevenue),
        avgCLV: Math.round(avgCLV * 100) / 100,
        customersWithOrders: customersWithOrders.length,
        customersWithoutOrders:
          completeCustomerList.length - customersWithOrders.length,
        topCustomerRevenue: topCustomerRevenue,
        topCustomerPercentage: Math.round(topCustomerPercentage * 10) / 10,
      },

      // CLV Distribution
      clvDistribution: clvRanges,

      // Insights
      insights: {
        averageOrdersPerCustomer:
          customersWithOrders.length > 0
            ? Math.round(
                (customersWithOrders.reduce(
                  (sum, c) => sum + c.totalOrders,
                  0
                ) /
                  customersWithOrders.length) *
                  10
              ) / 10
            : 0,
        averageOrderValue:
          customersWithOrders.length > 0
            ? Math.round(
                customersWithOrders.reduce(
                  (sum, c) => sum + c.avgOrderValue,
                  0
                ) / customersWithOrders.length
              )
            : 0,
        customerRetentionRate:
          completeCustomerList.length > 0
            ? Math.round(
                (customersWithOrders.length / completeCustomerList.length) *
                  1000
              ) / 10
            : 0,
      },

      // Metadata
      lastUpdated: new Date(),
      note: "CLV calculated based on total revenue from accepted orders only",
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching customer lifetime value:", error);
    res.status(500).json({
      error: "Failed to fetch customer lifetime value data",
      message: error.message,
    });
  }
});
export default router;
