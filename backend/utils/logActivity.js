import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async ({ userId, action, targetType, targetId, details }) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      targetType,
      targetId,
      details
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};
