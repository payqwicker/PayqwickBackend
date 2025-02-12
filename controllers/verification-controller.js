// // controllers/verificationController.js

// const User = require('../models/User'); 

// // Controller function to select a verification method
// const selectVerificationMethod = async (req, res) => {
//   const { user_id, verification_method } = req.body;

//   // Valid verification methods
//   const validMethods = ['NIN', 'Passport', 'Driver’s License', 'Voter’s Card'];

//   // Validate verification method
//   if (!validMethods.includes(verification_method)) {
//     return res.status(400).json({ error: 'Invalid verification method' });
//   }

//   try {
//     // Find the user in the database
//     const user = await User.findById(user_id);

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Update the user's verification method
//     user.verification_method = verification_method;
//     await user.save();

//     return res.status(200).json({ message: 'Verification method updated successfully' });
//   } catch (err) {
//     return res.status(500).json({ error: 'Server error' });
//   }
// };

// module.exports = {
//   selectVerificationMethod,
// };



const User = require("../models/User");

// Controller function to select a verification method (Authenticated)
const selectVerificationMethod = async (req, res) => {
  const { verification_method } = req.body;
  const userId = req.user.userId; // Get user ID from authenticated session

  // Valid verification methods
  const validMethods = ["NIN", "Passport", "Driver’s License", "Voter’s Card"];

  // Validate verification method
  if (!verification_method || !validMethods.includes(verification_method)) {
    return res.status(400).json({ error: "Invalid or missing verification method" });
  }

  try {
    // Find the authenticated user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's verification method
    user.verification_method = verification_method;
    await user.save();

    return res.status(200).json({ message: "Verification method updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  selectVerificationMethod,
};
