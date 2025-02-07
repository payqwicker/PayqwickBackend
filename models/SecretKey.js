const mongoose = require('mongoose');

const secretKeySchema = new mongoose.Schema({
  paystackKey: {
    type: String,
    required: true,
    unique: true,
  },
});

const Secret = mongoose.model('secretKey', secretKeySchema);

module.exports = Secret;
