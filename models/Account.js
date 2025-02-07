const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    unique: false,
  },
});

const Account = mongoose.model("Account", AccountSchema);

module.exports = Account;
