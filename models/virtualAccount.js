const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const virtualAccountSchema = new Schema({
  Id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: false,
  },
  email: {
    type: String, 
    required: true,
  },
  fullName: {
    type: String, //on production mode full name must be required
    required: true,
  },
  referenceNumber: {
    type: String,
  },
  phoneNumber: {
    type: String,
    // required: true,
    unique: false,
  },
  accountName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: false,
  },
  accountReference:{
    type: String,
  },
  createdAt: { type: Date, default: Date.now }
});

const virtualAccount = mongoose.model("persistentAccount", virtualAccountSchema);

module.exports = virtualAccount;
