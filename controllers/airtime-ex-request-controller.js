// controllers/exchangeRateController.js

const User = require("../models/User");
const AirtimeExRequest = require("../models/AirtimeExchangeRequest");

const getAllExchangeRequests = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }
  try {
    const exchangeRequests = await AirtimeExRequest.find();
    res.json(exchangeRequests);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addExchangeRequest = async (req, res) => {
  const {
    accountNumber,
    accountName,
    network,
    userId,
    amountSent,
    amountToReceive,
    bankName,
  } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }

  try {
    const newExchangeRequest = new AirtimeExRequest({
      accountNumber,
      accountName,
      network,
      userId,
      amountSent,
      amountToReceive,
      bankName,
    });

    await newExchangeRequest.save();
    res.json(newExchangeRequest);
  } catch (error) {
    console.log(error.message);
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
    const updatedRequest = await AirtimeExRequest.findByIdAndUpdate(
      requestId,
      { $set: { isCompleted: isCompleted } },
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
  getAllExchangeRequests,
  addExchangeRequest,
  updateIsCompleted,
};
