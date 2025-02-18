const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",  // References the User model
    required: true,  // Ensure every transaction is linked to a user
  },
  referenceNumber: {
    type: String,
    required: true,  // Unique identifier for the transaction
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],  // Ensure the status is one of the predefined values
    default: 'pending',  // Default status is 'pending'
  },
  transactionReference: {
    type: String,
    required: true,  // Reference from an external system (e.g., payment gateway)
  },
  amount: {
    type: Number,
    required: true,  // The amount involved in the transaction
  },
  recipient: {
    type: String,
    required: true,  // Recipient of the transaction
  },
  fee: {
    type: Number,
    default: 0,  // Transaction fee (defaults to 0 if not specified)
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer'],  // Define transaction types
    required: true,
  },
  transactionId: {
    type: String,
    unique: true,  // Ensures that each transaction has a unique ID
    required: true,
  },
  dateUTC: {
    type: Date,  // Storing date as a Date object rather than a number
    default: Date.now,  // Default value is the current timestamp
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
