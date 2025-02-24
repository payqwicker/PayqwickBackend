const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links wallet to a user
    required: true,
  },
  pagaAccountNumber: {
    type: String, // NUBAN assigned by Paga
    unique: true,
    required: true,
  },
  pagaAccountReference: {
    type: String, // Unique reference for the wallet
    unique: true,
    required: true,
  },
  balance: {
    type: Number,
    default: 0, // Default balance is 0
  },
  currency: {
    type: String,
    default: 'NGN',
  },
  isActive: {
    type: Boolean,
    default: true, // Indicates if the wallet is active
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
