const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
  referenceNumber: {
    type: String,
  },
  status: {
    type: String,
  },
  transactionReference: {
    type: String,
  },
  amount: {
    type: Number,
  },
  recipient: {
    type: String,
  },
  fee: {
    type: Number,
  },

  transactionType: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  dateUTC: {
    type: Number,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
