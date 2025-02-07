const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionHistorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["success", "pending", "failed"],
    default: "pending",
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const TransactionHistory = mongoose.model(
  "TransactionHistory",
  transactionHistorySchema
);

module.exports = TransactionHistory;
