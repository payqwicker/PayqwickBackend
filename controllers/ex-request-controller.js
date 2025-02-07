// controllers/exchangeRateController.js

const User = require("../models/User");
const ExchangeRequest = require("../models/ExchangeRequest");

const getAllExRequest = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }
  try {
    const exchangeRates = await ExchangeRequest.find();
    res.json(exchangeRates);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addExRequest = async (req, res) => {
  const {
    currency,
    accountNumber,
    accountName,
    walletAddress,
    walletNetwork,
    userId,
    amountSent,
    amountToReceive,
    transactionType,
    bankName,
  } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }

  try {
    const newExchangeRate = new ExchangeRequest({
      currency,
      accountNumber,
      accountName,
      walletAddress,
      walletNetwork,
      userId,
      amountSent,
      amountToReceive,
      transactionType,
      bankName,
    });

    await newExchangeRate.save();
    res.json(newExchangeRate);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function updateIsCompleted(req, res) {
  try {
    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    // Extract the isCompleted value from the request body
    const { isCompleted } = req.body;

    // Find the ExRequest by ID and update the isCompleted field
    const updatedRequest = await ExchangeRequest.findByIdAndUpdate(
      requestId,
      { $set: { isCompleted: true } },
      { new: true } // Return the updated document
    );

    // Check if the request was not found
    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Respond with the updated ExRequest
    res.json({ message: "Updated Successfully" });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getAllExRequest,
  addExRequest,
  updateIsCompleted,
};
