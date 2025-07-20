// routes/admin.js
import express from "express";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js"; // Assuming this model exists
import Inquiry from "../models/Inquiry.js";

const router = express.Router();

router.get("/dashboard-stats", async (req, res) => {
  try {
    const orders = await Order.find();
    const acceptedOrders = await Order.find({ status: "Accept" });
    const totalRevenue = acceptedOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    // Total Orders
    const totalOrders = orders.length;

    // Active Customers
    const customers = await Customer.find();
    const activeCustomers = customers.filter(
      (c) => c.status === "Active"
    ).length;

    // Pending Quotes
    const pendingQuotes = orders.filter(
      (order) => order.status === "Open" || order.status === "Sent"
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
router.get('/orders/recent', async (req, res) => {
  try {
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const inquiryIds = recentOrders.map(order => order.inquiryId);
    
    // Populate the customerId in inquiries to get company name
    const inquiries = await Inquiry.find({ inquiryId: { $in: inquiryIds } })
      .populate('customerId', 'companyName')
      .lean();

    // Create a lookup map for company names
    const inquiryMap = {};
    inquiries.forEach(inquiry => {
      inquiryMap[inquiry.inquiryId] = inquiry.customerId?.companyName || 'N/A';
    });

    // Attach companyName to each order
    const enrichedOrders = recentOrders.map(order => ({
      ...order,
      companyName: inquiryMap[order.inquiryId] || 'Unknown',
    }));

    res.status(200).json(enrichedOrders);
  } catch (err) {
    console.error('Error fetching recent orders:', err);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});
// GET /api/admin/top-customers
router.get('/top-customers', async (req, res) => {
  try {
    const topCustomers = await Order.aggregate([
      {
        $lookup: {
          from: 'inquiries',
          localField: 'inquiryId',
          foreignField: 'inquiryId',
          as: 'inquiry'
        }
      },
      { $unwind: '$inquiry' },
      {
        $lookup: {
          from: 'customers',
          localField: 'inquiry.customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $group: {
          _id: '$customer._id',
          companyName: { $first: '$customer.companyName' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json(topCustomers);
  } catch (err) {
    console.error('Error fetching top customers:', err);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
});

// GET /api/admin/orders/delayed-actions
router.get('/orders/delayed-actions', async (req, res) => {
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
            $nin: ['Accept', 'Decline', 'Negotiated'] // Exclude final statuses
          }
        }
      },
      {
        // Add a field to calculate days since order creation
        $addFields: {
          daysSinceCreated: {
            $divide: [
              { $subtract: [currentDate, '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      {
        // Group by status and calculate statistics
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDays: { $avg: '$daysSinceCreated' },
          maxDays: { $max: '$daysSinceCreated' },
          minDays: { $min: '$daysSinceCreated' },
          orders: {
            $push: {
              orderId: '$_id',
              companyName: '$companyName',
              createdAt: '$createdAt',
              days: '$daysSinceCreated'
            }
          }
        }
      },
      {
        // Project the final structure
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          avgDays: { $round: ['$avgDays', 1] },
          maxDays: { $round: ['$maxDays', 1] },
          minDays: { $round: ['$minDays', 1] },
          orders: 1
        }
      },
      {
        // Sort by count (highest first) and then by avgDays (highest first)
        $sort: { count: -1, avgDays: -1 }
      }
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
    console.error('Error fetching delayed actions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch delayed actions',
      message: error.message 
    });
  }
});
router.get('/customer-segmentation', async (req, res) => {
  try {
    // Get all customers first
    const allCustomersFromDB = await Customer.find({});

    // Get inquiry counts for each customer
    const customerInquiryCounts = await Inquiry.aggregate([
      {
        $group: {
          _id: '$customerId',
          inquiryCount: { $sum: 1 },
          firstInquiry: { $min: '$createdAt' },
          lastInquiry: { $max: '$createdAt' }
        }
      }
    ]);

    // Create a map for quick lookup of inquiry counts
    const inquiryCountMap = {};
    customerInquiryCounts.forEach(item => {
      inquiryCountMap[item._id.toString()] = {
        inquiryCount: item.inquiryCount,
        firstInquiry: item.firstInquiry,
        lastInquiry: item.lastInquiry
      };
    });

    // Combine all customers with their inquiry counts
    const allCustomers = allCustomersFromDB.map(customer => {
      const inquiryData = inquiryCountMap[customer._id.toString()] || {
        inquiryCount: 0,
        firstInquiry: null,
        lastInquiry: null
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
        lastInquiry: inquiryData.lastInquiry
      };
    });

    // Segment customers based on inquiry count
    const newCustomers = allCustomers.filter(customer => customer.inquiryCount <= 1);
    const repeatCustomers = allCustomers.filter(customer => customer.inquiryCount > 1);

    const totalCustomers = allCustomers.length;
    const newCustomerCount = newCustomers.length;
    const repeatCustomerCount = repeatCustomers.length;

    // Calculate percentages
    const newCustomerPercentage = totalCustomers > 0 ? (newCustomerCount / totalCustomers) * 100 : 0;
    const repeatCustomerPercentage = totalCustomers > 0 ? (repeatCustomerCount / totalCustomers) * 100 : 0;

    // Additional analytics
    const avgInquiriesPerCustomer = totalCustomers > 0 ? 
      allCustomers.reduce((sum, customer) => sum + customer.inquiryCount, 0) / totalCustomers : 0;

    // Find top repeat customers
    const topRepeatCustomers = repeatCustomers
      .sort((a, b) => b.inquiryCount - a.inquiryCount)
      .slice(0, 5)
      .map(customer => ({
        customerId: customer.customerId,
        custId: customer.custId,
        companyName: customer.companyName,
        customerName: customer.customerName,
        email: customer.email,
        mobile: customer.mobile,
        inquiryCount: customer.inquiryCount,
        firstInquiry: customer.firstInquiry,
        lastInquiry: customer.lastInquiry,
        daysSinceFirstInquiry: customer.firstInquiry ? Math.floor((new Date() - new Date(customer.firstInquiry)) / (1000 * 60 * 60 * 24)) : null,
        daysSinceLastInquiry: customer.lastInquiry ? Math.floor((new Date() - new Date(customer.lastInquiry)) / (1000 * 60 * 60 * 24)) : null
      }));

    // Customer retention insights - customers who came back for more inquiries
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomerCount / totalCustomers) * 100 : 0;
    
    // Calculate time-based insights (customers acquired in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentNewCustomers = newCustomers.filter(customer => 
      customer.firstInquiry && new Date(customer.firstInquiry) >= thirtyDaysAgo
    );

    // Calculate customers by activity level
    const veryActiveCustomers = allCustomers.filter(c => c.inquiryCount >= 5).length;
    const moderateCustomers = allCustomers.filter(c => c.inquiryCount >= 3 && c.inquiryCount < 5).length;

    // Calculate average days between inquiries for repeat customers
    const avgDaysBetweenInquiries = repeatCustomers.length > 0 ? 
      repeatCustomers.reduce((sum, customer) => {
        if (!customer.firstInquiry || !customer.lastInquiry) return sum;
        const daysBetween = Math.floor((new Date(customer.lastInquiry) - new Date(customer.firstInquiry)) / (1000 * 60 * 60 * 24));
        return sum + (daysBetween / (customer.inquiryCount - 1));
      }, 0) / repeatCustomers.length : 0;

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
      moderateCustomers: moderateCustomers,     // 3-4 inquiries
      
      // Top repeat customers
      topRepeatCustomers: topRepeatCustomers,
      
      // Breakdown by inquiry count - more detailed segmentation
      inquiryCountBreakdown: {
        oneInquiry: newCustomerCount,
        twoInquiries: allCustomers.filter(c => c.inquiryCount === 2).length,
        threeInquiries: allCustomers.filter(c => c.inquiryCount === 3).length,
        fourInquiries: allCustomers.filter(c => c.inquiryCount === 4).length,
        fivePlusInquiries: allCustomers.filter(c => c.inquiryCount >= 5).length
      },

      // Customer lifecycle insights
      lifecycle: {
        newCustomers: {
          count: newCustomerCount,
          recentCount: recentNewCustomers.length,
          percentage: Math.round(newCustomerPercentage * 10) / 10
        },
        returningCustomers: {
          count: repeatCustomerCount,
          percentage: Math.round(repeatCustomerPercentage * 10) / 10,
          avgInquiries: repeatCustomers.length > 0 ? 
            Math.round((repeatCustomers.reduce((sum, c) => sum + c.inquiryCount, 0) / repeatCustomers.length) * 10) / 10 : 0
        }
      },

      // Metadata
      lastUpdated: new Date(),
      totalInquiries: await Inquiry.countDocuments(),
      note: "Segmentation based on inquiry behavior - customers with ≤1 inquiry are 'new', >1 are 'repeat'"
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching customer segmentation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer segmentation data',
      message: error.message 
    });
  }
});
// Fixed backend route for top products
router.get('/top-products', async (req, res) => {
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
          category: { $first: "$items.category" } // Include category info
        }
      },
      // Sort by total quantity in descending order
      { $sort: { totalQuantity: -1 } },
      // Limit to top 10 products
      { $limit: 10 }
    ]);

    // Format the response to match frontend expectations
    const formattedResult = result.map(item => ({
      _id: item._id,
      name: item._id,
      totalQuantity: item.totalQuantity,
      brand: item.brand,
      category: item.category
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ 
      error: "Failed to fetch top products.",
      details: error.message 
    });
  }
});
// Customer Lifetime Value API endpoint
router.get('/customer-lifetime-value', async (req, res) => {
  try {
    // Get all customers with their CLV
    const customerCLV = await Order.aggregate([
      {
        // Only include accepted orders for revenue calculation
        $match: {
          status: 'Accept'
        }
      },
      {
        // Get customer info from inquiries
        $lookup: {
          from: 'inquiries',
          localField: 'inquiryId',
          foreignField: 'inquiryId',
          as: 'inquiry'
        }
      },
      {
        $unwind: '$inquiry'
      },
      {
        // Get customer details
        $lookup: {
          from: 'customers',
          localField: 'inquiry.customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        // Group by customer to calculate CLV
        $group: {
          _id: '$customer._id',
          customerId: { $first: '$customer._id' },
          custId: { $first: '$customer.custId' },
          companyName: { $first: '$customer.companyName' },
          customerName: { $first: '$customer.customerName' },
          email: { $first: '$customer.email' },
          mobile: { $first: '$customer.mobile' },
          status: { $first: '$customer.status' },
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' },
          avgOrderValue: { $avg: '$totalPrice' }
        }
      },
      {
        // Add calculated fields
        $addFields: {
          customerLifetimeMonths: {
            $ceil: {
              $divide: [
                { $subtract: ['$$NOW', '$firstOrderDate'] },
                1000 * 60 * 60 * 24 * 30 // Convert to months
              ]
            }
          },
          daysSinceLastOrder: {
            $floor: {
              $divide: [
                { $subtract: ['$$NOW', '$lastOrderDate'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Get all customers (including those with no orders) for complete picture
    const allCustomers = await Customer.find({});
    
    // Create a map of customers with CLV
    const clvMap = {};
    customerCLV.forEach(customer => {
      clvMap[customer.customerId.toString()] = customer;
    });

    // Include customers with zero CLV
    const completeCustomerList = allCustomers.map(customer => {
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
          daysSinceLastOrder: null
        };
      }
    });

    // Sort by total revenue (CLV)
    completeCustomerList.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate summary statistics
    const totalRevenue = completeCustomerList.reduce((sum, customer) => sum + customer.totalRevenue, 0);
    const customersWithOrders = completeCustomerList.filter(customer => customer.totalOrders > 0);
    const avgCLV = customersWithOrders.length > 0 ? totalRevenue / customersWithOrders.length : 0;
    const topCustomerRevenue = completeCustomerList.length > 0 ? completeCustomerList[0].totalRevenue : 0;
    const topCustomerPercentage = totalRevenue > 0 ? (topCustomerRevenue / totalRevenue) * 100 : 0;

    // Get top 10 customers for detailed view
    const topCustomers = completeCustomerList.slice(0, 10).map(customer => ({
      ...customer,
      revenuePercentage: totalRevenue > 0 ? Math.round((customer.totalRevenue / totalRevenue) * 1000) / 10 : 0
    }));

    // CLV distribution analysis
    const clvRanges = {
      high: completeCustomerList.filter(c => c.totalRevenue >= 100000).length, // >= 1L
      medium: completeCustomerList.filter(c => c.totalRevenue >= 50000 && c.totalRevenue < 100000).length, // 50K-1L
      low: completeCustomerList.filter(c => c.totalRevenue >= 10000 && c.totalRevenue < 50000).length, // 10K-50K
      minimal: completeCustomerList.filter(c => c.totalRevenue > 0 && c.totalRevenue < 10000).length, // <10K
      zero: completeCustomerList.filter(c => c.totalRevenue === 0).length // No orders
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
        customersWithoutOrders: completeCustomerList.length - customersWithOrders.length,
        topCustomerRevenue: topCustomerRevenue,
        topCustomerPercentage: Math.round(topCustomerPercentage * 10) / 10
      },
      
      // CLV Distribution
      clvDistribution: clvRanges,
      
      // Insights
      insights: {
        averageOrdersPerCustomer: customersWithOrders.length > 0 ? 
          Math.round((customersWithOrders.reduce((sum, c) => sum + c.totalOrders, 0) / customersWithOrders.length) * 10) / 10 : 0,
        averageOrderValue: customersWithOrders.length > 0 ?
          Math.round((customersWithOrders.reduce((sum, c) => sum + c.avgOrderValue, 0) / customersWithOrders.length)) : 0,
        customerRetentionRate: completeCustomerList.length > 0 ? 
          Math.round((customersWithOrders.length / completeCustomerList.length) * 1000) / 10 : 0
      },
      
      // Metadata
      lastUpdated: new Date(),
      note: "CLV calculated based on total revenue from accepted orders only"
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching customer lifetime value:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer lifetime value data',
      message: error.message 
    });
  }
});
export default router;
