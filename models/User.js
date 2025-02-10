const mongoose = require('mongoose');
const cron = require('node-cron');

const userSchema = new mongoose.Schema({
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
  otpRequestCount: { type: Number, default: 0 },  // Tracks OTP request count per hour
  otpRequestWindow: { type: Date },
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
