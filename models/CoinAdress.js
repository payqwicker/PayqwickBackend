const mongoose = require("mongoose");

const CoinAdressSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
  },
  network: {
    type: String,
    required: true,
  },
});

const CoinAddress = mongoose.model("CoinAddress", CoinAdressSchema);

module.exports = CoinAddress;
