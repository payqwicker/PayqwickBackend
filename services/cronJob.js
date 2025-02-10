const cron = require('node-cron');
const User = require('../models/User');

// Schedule the cron job
const invalidateExpiredOtps = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const currentTime = new Date();
      // Find and update users with expired OTPs
      const result = await User.updateMany(
        {
          emailVerificationOTPExpires: { $lt: currentTime }, // OTP expired
        },
        {
          $set: {
            emailVerificationOTP: null, // Invalidate OTP
            emailVerificationOTPExpires: null, // Clear expiration time
          },
        }
      );

      console.log(`Expired OTPs invalidated for ${result.nModified} users`);
    } catch (error) {
      console.error('Error invalidating expired OTPs:', error);
    }
  });
};

module.exports = { invalidateExpiredOtps };
