const Notification = require('../models/Notification');

//  Get My Notifications 
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get Unread Count 
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user.id,
      is_read: false
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Mark One as Read 
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Mark All as Read 
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { is_read: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Delete One 
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id:     req.params.id,
      user_id: req.user.id
    });

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};