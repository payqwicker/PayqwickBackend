const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // firstName: {
  //   type: String,
  //   required: true,
  // },
  // lastName: {
  //   type: String,
  //   required: true,
  // },
  fullName: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  isKYC: {
    type: Boolean,
    default: false,
  },

  userType: {
    type: String,
    enum: ["admin", "user", "user2"],
    default: "user",
  },
  passwordResetOtp: {
    type: String,
    default: null,
  },
  passwordResetOtpExpires: {
    type: Date,
    default: null,
  },
  emailVerificationOTP: {
    type: String,
    default: null,
  },
  emailVerificationOTPExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
