const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const exRequestSchema = new Schema({
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
  walletAddress: {
    type: String,
  },
  walletNetwork: {
    type: String,
  },
  currency: {
    type: String,
  },
  amountSent: {
    type: String,
  },
  amountToReceive: {
    type: String,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  transactionType: {
    type: String,
  },
  cryptoTransaction: {
    type: Schema.Types.ObjectId,
    ref: "Crypto",
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ExRequest = mongoose.model("ExRequest", exRequestSchema);

module.exports = ExRequest;
