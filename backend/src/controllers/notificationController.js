const notificationService = require('../services/notificationService');

// GET /api/notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getMyNotifications(req.user.id, req.query.limit);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({
      success: true,
      count,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.user.id, req.params.id);
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};