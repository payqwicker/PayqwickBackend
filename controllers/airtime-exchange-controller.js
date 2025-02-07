// controllers/exchangeRateController.js

const User = require("../models/User");
const AirtimeExchange = require("../models/AirtimeExchange");

const getExchangeData = async (req, res) => {
  try {
    const exchangeData = await AirtimeExchange.find();
    res.json(exchangeData);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addExchangeSetting = async (req, res) => {
  const {
    feePercentage,
    mtnNumber,
    gloNumber,
    airtelNumber,
    etisalatNumber,
    userId,
  } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const settings = await AirtimeExchange.findOne();

    if (!settings) {
      const newExchangeRate = new AirtimeExchange({
        feePercentage,
        mtnNumber,
        gloNumber,
        airtelNumber,
        etisalatNumber,
        userId,
      });
      await newExchangeRate.save();
      return res.status(200).json(newExchangeRate);
    } else {
      const updatedExchangeData = await AirtimeExchange.findOneAndUpdate(
        { userId },
        { feePercentage, mtnNumber, gloNumber, airtelNumber, etisalatNumber },
        { new: true }
      );
      return res.status(200).json(updatedExchangeData);
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editExchangeData = async (req, res) => {
  const { id } = req.params;
  const {
    feePercentage,
    mtnNumber,
    gloNumber,
    airtelNumber,
    etisalatNumber,
    userId,
  } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const updatedExchangeData = await AirtimeExchange.findByIdAndUpdate(
      id,
      { feePercentage, mtnNumber, gloNumber, airtelNumber, etisalatNumber },
      { new: true }
    );

    if (!updatedExchangeData) {
      return res.status(404).json({ error: "Exchange data not found" });
    }

    res.json(updatedExchangeData);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteExchangeRate = async (req, res) => {
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
    const deletedExchangeRate = await AirtimeExchange.findByIdAndRemove(id);

    if (!deletedExchangeRate) {
      return res.status(404).json({ error: "Exchange rate not found" });
    }

    res.json({ message: "Exchange rate deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getExchangeData,
  addExchangeSetting,
  editExchangeData,
  deleteExchangeRate,
};
