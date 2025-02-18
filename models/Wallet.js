const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  sabalance: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'NGN', 'EUR', 'GBP'], // Add more currencies as required
    default: 'NGN', // Default currency set to NGN
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
