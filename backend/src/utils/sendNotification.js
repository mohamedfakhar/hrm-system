const Notification = require("../models/Notification");

const sendNotification = async (
  app,
  userId,
  { title, message, type, related_id },
) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_id: related_id || null,
    });

    const io = app.get("io");
    const connectedUsers = app.get("connectedUsers");
    const socketId = connectedUsers.get(userId.toString());

    if (socketId) {
      io.to(socketId).emit("notification", {
        _id: notification._id,
        title,
        message,
        type,
        is_read: false,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};

module.exports = sendNotification;
