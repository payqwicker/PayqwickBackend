const Notification = require("../models/Notification");

const getUserNotifications = async (req, res) => {
    try {
      const userId = req.user.id; // Extract user ID from the authenticated request
  
      const notifications = await Notification.find({ user_id: userId })
        .sort({ timestamp: -1 }); // Fetch notifications in descending order
  
      if (notifications.length === 0) {
        return res.status(404).json({ message: 'No notifications found' });
      }
  
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  module.exports = { getUserNotifications };