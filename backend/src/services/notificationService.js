const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Get paginated/recent notifications for user
   */
  async getMyNotifications(userId, limit = 50) {
    return await Notification.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      user_id: userId,
      is_read: false
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { is_read: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
    return true;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId, notificationId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      user_id: userId
    });

    if (!result) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }

    return true;
  }
}

module.exports = new NotificationService();
