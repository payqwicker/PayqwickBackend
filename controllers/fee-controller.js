const User = require("../models/User");
const Fee = require("../models/Fee");
const ExchangeSettings = require("../models/ExchangeSettings");

const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find();
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addFee = async (req, res) => {
  const { firstPair, secondPair, userId, fee } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    let pairExists = await Fee.findOne({ firstPair, secondPair });

    if (pairExists) {
      return res
        .status(200)
        .json({ message: "Fee for currency pair already exists", ok: false });
    }

    let exchange = await ExchangeSettings.findOne({ userId });

    if (!exchange) {
      exchange = new ExchangeSettings({
        userId,
        fee: 0,
        exchanges: [],
        fees: [],
      });
    }
    const newFee = await Fee.create({
      firstPair,
      secondPair,
      fee,
    });

    exchange.fees.push(newFee);

    const savedExchange = await exchange.save();
    res.json(savedExchange);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editFee = async (req, res) => {
  const { id } = req.params;
  const { userId, fee } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const updatedFee = await Fee.findByIdAndUpdate(id, { fee }, { new: true });

    if (!updatedFee) {
      return res.status(404).json({ error: "Fee not found" });
    }

    res.json(updatedFee);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteFee = async (req, res) => {
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
    const deletedFee = await Fee.findByIdAndRemove(id);

    if (!deletedFee) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    res.json({ message: "Fee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addFee,
  getAllFees,
  addFee,
  editFee,
  deleteFee,
};
