const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({
  idCardImageUrl: String,
  idCardName: String,
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

const KYC = mongoose.model("KYC", kycSchema);

module.exports = KYC;
