const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  firstPair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exchange",
    required: true,
  },
  secondPair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exchange",
    required: true,
  },
  fee: {
    type: Number,
    required: true,
  },
});

const Fee = mongoose.model("Fee", feeSchema);

module.exports = Fee;
