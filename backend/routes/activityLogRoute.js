// routes/activityLog.js
import express from 'express';
import ActivityLog from '../models/ActivityLog.js'; // Update path if needed

const router = express.Router();

// GET /api/activity-logs/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50; // optional query param

    const logs = await ActivityLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
