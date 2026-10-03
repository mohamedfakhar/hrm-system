const Notification = require('../models/Notification');

/**
 * Persists notification in DB and emits real-time event to all active user sockets
 */
const sendNotification = async (
  app,
  userId,
  { title, message, type, related_id, related_type }
) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_id: related_id || null,
      related_type: related_type || null
    });

    const io = app.get('io');
    const connectedUsers = app.get('connectedUsers');

    if (io && connectedUsers) {
      const userSockets = connectedUsers.get(userId.toString());
      if (userSockets && userSockets.size > 0) {
        const payload = {
          _id: notification._id,
          title,
          message,
          type,
          is_read: false,
          createdAt: notification.createdAt,
          related_id: notification.related_id
        };

        userSockets.forEach((socketId) => {
          io.to(socketId).emit('notification', payload);
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Notification dispatch error:', error.message);
  }
};

module.exports = sendNotification;
