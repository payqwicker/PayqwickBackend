// controllers/exchangeRateController.js

const User = require("../models/User");
const CoinAddress = require("../models/CoinAdress");

const getAllWalletAddress = async (req, res) => {
  try {
    const exchangeRates = await CoinAddress.find();
    res.json(exchangeRates);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addWalletAddress = async (req, res) => {
  const { currency, address, network, userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const newCoinAddress = new CoinAddress({
      currency,
      walletAddress: address,
      network,
    });

    await newCoinAddress.save();
    res.json(newCoinAddress);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteWalletAddress = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const deletedCoinAddress = await CoinAddress.findByIdAndRemove(id);

    if (!deletedCoinAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllWalletAddress,
  addWalletAddress,
  deleteWalletAddress,
};
