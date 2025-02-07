const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const exchangeSettingsSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
  exchanges: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
    },
  ],
  fees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
    },
  ],
});

const ExchangeSettings = mongoose.model(
  "ExchangeSettings",
  exchangeSettingsSchema
);

module.exports = ExchangeSettings;
