const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const airtimeExRequestSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
  accountName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  bankName: {
    type: String,
  },
  network: {
    type: String,
  },
  amountSent: {
    type: String,
  },
  amountToReceive: {
    type: String,
  },
  isCompleted: {
    type: String,
    enum: ["failed", "Pending", "Sent", "Completed"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AirtimeExRequest = mongoose.model(
  "AirtimeExchangeRequest",
  airtimeExRequestSchema
);

module.exports = AirtimeExRequest;
