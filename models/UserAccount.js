const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserAccountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
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

const UserAccount = mongoose.model("UserAccount", UserAccountSchema);

module.exports = UserAccount;
