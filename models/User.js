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
  verification_method: {
    type: String,
    enum: ['NIN', 'Passport', 'Driver’s License', 'Voter’s Card', 'BVN'],
  },
  verification_data: {
    type: Map,
    of: String,
  },
  otpRequestCount: { 
    type: Number, 
    default: 0 
  },
  otpRequestWindow: { 
    type: Date 
  },
  pagaAccountNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null values for users without a Paga account
  },
  bvn: {
    type: String,
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
