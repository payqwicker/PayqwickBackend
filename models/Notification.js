const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true,  // Ensure the notification ID is unique
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",  // Reference to the User model (which user the notification is for)
    required: true,
  },
  message: {
    type: String,
    required: true,  // The content of the notification
  },
  timestamp: {
    type: Date,
    default: Date.now,  // Default to the current date and time when the notification is created
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],  // Possible statuses for the notification
    default: 'unread',  // Default status is 'unread'
  },
  type: {
    type: String,
    enum: ['alert', 'message', 'system'],  // Notification types (can be customized as needed)
    default: 'alert',  // Default type is 'alert'
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
