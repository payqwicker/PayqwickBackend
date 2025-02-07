const User = require("../models/User");

const submitKYC = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", ok: false });
    }

    // Update the user's KYC status
    user.isKYC = true;
    await user.save();

    res.status(200).json({ message: 'KYC updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating KYC', error: error.message });
  }
};

const verifyKYC = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", ok: false });
    }
     if (user.userType === "admin")
     {
      return res.status(403).json({
        message: "KYC process not for Admin!.",
      });
     }
    res.status(200).json({ isKYC: user.isKYC });
    
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving KYC status', error: error.message });
  }
};


module.exports = {
  submitKYC,
  verifyKYC
};
