const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cryptoSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
  status: {
    type: String,
  },
  transactionReference: {
    type: String,
  },
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: "Transaction",
  },
  address: {
    type: String,
  },
  currency: {
    type: String,
  },
  amount: {
    type: Number,
  },
  amountinUSD: {
    type: Number,
  },
  amountinNGN: {
    type: Number,
  },
  description: {
    type: String,
  },
  dateUTC: {
    type: Number,
  },
});

const Crypto = mongoose.model("Crypto", cryptoSchema);

module.exports = Crypto;
