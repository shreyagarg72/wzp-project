// utils/notifications.js
import ActivityLog from '../models/ActivityLog.js';
import Inquiry from '../models/Inquiry.js';
import Order from '../models/Order.js';

export class NotificationManager {
  constructor() {
    this.notificationTypes = {
      OVERDUE_INQUIRY: 'overdue_inquiry',
      PENDING_RESPONSE: 'pending_response',
      MISSING_QUOTES: 'missing_quotes',
      LOW_STOCK: 'low_stock',
      SYSTEM_ALERT: 'system_alert'
    };
  }

  // Create notification in activity log
  async createNotification(userId, type, message, details = {}) {
    try {
      await ActivityLog.create({
        user: userId,
        action: `NOTIFICATION: ${message}`,
        targetType: type,
        targetId: details.targetId || null,
        details: {
          notificationType: type,
          priority: details.priority || 'medium',
          ...details
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Check for overdue inquiries
  async checkOverdueInquiries() {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    
    const overdueInquiries = await Inquiry.find({
      status: 'Processing',
      updatedAt: { $lt: tenDaysAgo }
    }).populate('customerId');

    for (const inquiry of overdueInquiries) {
      await this.createNotification(
        null, // System notification
        this.notificationTypes.OVERDUE_INQUIRY,
        `Inquiry ${inquiry.inquiryId} has been in processing for over 10 days`,
        {
          priority: 'high',
          targetId: inquiry._id,
          inquiryId: inquiry.inquiryId,
          customer: inquiry.customerId?.companyName,
          daysOverdue: Math.floor((Date.now() - inquiry.updatedAt) / (1000 * 60 * 60 * 24))
        }
      );
    }

    return overdueInquiries.length;
  }

  // Check for pending order responses
  async checkPendingOrderResponses() {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    
    const pendingOrders = await Order.find({
      status: 'Sent',
      createdAt: { $lt: tenDaysAgo }
    });

    let notificationCount = 0;
    for (const order of pendingOrders) {
      const inquiry = await Inquiry.findOne({ inquiryId: order.inquiryId })
        .populate('customerId');

      if (inquiry) {
        await this.createNotification(
          null, // System notification
          this.notificationTypes.PENDING_RESPONSE,
          `Order ${order.orderId} sent 10 days ago without customer response`,
          {
            priority: 'medium',
            targetId: order._id,
            orderId: order.orderId,
            customer: inquiry.customerId?.companyName,
            daysPending: Math.floor((Date.now() - order.createdAt) / (1000 * 60 * 60 * 24))
          }
        );
        notificationCount++;
      }
    }

    return notificationCount;
  }

  // Check for inquiries without supplier quotes
  async checkMissingSupplierQuotes() {
    const inquiriesWithoutQuotes = await Inquiry.find({
      $and: [
        {
          $or: [
            { supplierQuotes: { $size: 0 } },
            { supplierQuotes: { $exists: false } }
          ]
        },
        { status: { $in: ['Open', 'Processing'] } },
        { createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // At least 1 day old
      ]
    }).populate('customerId');

    for (const inquiry of inquiriesWithoutQuotes) {
      await this.createNotification(
        null,
        this.notificationTypes.MISSING_QUOTES,
        `Inquiry ${inquiry.inquiryId} has no supplier quotes`,
        {
          priority: 'medium',
          targetId: inquiry._id,
          inquiryId: inquiry.inquiryId,
          customer: inquiry.customerId?.companyName,
          daysWithoutQuotes: Math.floor((Date.now() - inquiry.createdAt) / (1000 * 60 * 60 * 24))
        }
      );
    }

    return inquiriesWithoutQuotes.length;
  }

  // Run all notification checks
  async runAllChecks() {
    console.log('Starting notification checks...');
    
    try {
      const [overdueCount, pendingCount, missingQuotesCount] = await Promise.all([
        this.checkOverdueInquiries(),
        this.checkPendingOrderResponses(),
        this.checkMissingSupplierQuotes()
      ]);

      console.log(`Notification check completed:
        - Overdue inquiries: ${overdueCount}
        - Pending responses: ${pendingCount}
        - Missing quotes: ${missingQuotesCount}`);

      // Create summary notification if there are issues
      if (overdueCount > 0 || pendingCount > 0 || missingQuotesCount > 0) {
        await this.createNotification(
          null,
          this.notificationTypes.SYSTEM_ALERT,
          `Daily system check found ${overdueCount + pendingCount + missingQuotesCount} items requiring attention`,
          {
            priority: 'low',
            overdueInquiries: overdueCount,
            pendingOrders: pendingCount,
            missingQuotes: missingQuotesCount
          }
        );
      }

      return {
        overdueCount,
        pendingCount,
        missingQuotesCount,
        totalIssues: overdueCount + pendingCount + missingQuotesCount
      };

    } catch (error) {
      console.error('Error running notification checks:', error);
      
      await this.createNotification(
        null,
        this.notificationTypes.SYSTEM_ALERT,
        'Error occurred during notification check',
        {
          priority: 'high',
          error: error.message
        }
      );

      return { error: error.message };
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayNotifications, weekNotifications, totalNotifications] = await Promise.all([
      ActivityLog.countDocuments({
        action: { $regex: /^NOTIFICATION:/ },
        timestamp: { $gte: todayStart }
      }),
      ActivityLog.countDocuments({
        action: { $regex: /^NOTIFICATION:/ },
        timestamp: { $gte: weekStart }
      }),
      ActivityLog.countDocuments({
        action: { $regex: /^NOTIFICATION:/ }
      })
    ]);

    return {
      today: todayNotifications,
      thisWeek: weekNotifications,
      total: totalNotifications
    };
  }

  // Mark notification as read (for future use)
  async markNotificationAsRead(notificationId, userId) {
    try {
      await ActivityLog.findByIdAndUpdate(notificationId, {
        $set: {
          'details.readBy': userId,
          'details.readAt': new Date()
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();