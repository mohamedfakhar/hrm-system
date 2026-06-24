const Notification = require ('../models/Notification');

const sendNotification = async ( app, userId, { titel, message, type , related_id}) =>{
    try {
        
        const notification = await Notification.create({
            user_id: userId,
            titel,
            message,
            type,
            related_id: related_id || null
        });

        const io = app.get('io');
        const connectedUsers = app.get('connectedUsers');
        const socketId = connectedUsers.get(userId.toString());

      if(socketId) {
        io.to(socketId).emit('notification', {
            _id: notification._id,
            titel,
            message,
            type,
            is_read: false,
            created_at: notification.created_At
        });

      }
      return notification;
    } catch (error) {
        console.error('Notification error:', error.message)
        
    }
};
module.exports = sendNotification;