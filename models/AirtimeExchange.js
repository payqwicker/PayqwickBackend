const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const airtimeExchangeSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },
  feePercentage: {
    type: Number,
    required: true,
  },
  mtnNumber: {
    type: Number,
  },
  airtelNumber: {
    type: Number,
  },
  gloNumber: {
    type: Number,
  },
  etisalatNumber: {
    type: Number,
  },
});

const AirtimeExchange = mongoose.model(
  "AirtimeExchange",
  airtimeExchangeSchema
);

module.exports = AirtimeExchange;
