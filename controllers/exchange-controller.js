// controllers/exchangeRateController.js

const User = require("../models/User");
const Exchange = require("../models/Exchange");
const ExchangeSettings = require("../models/ExchangeSettings");
const cloudinary = require("../config/cloudinary");

const getAllExchanges = async (req, res) => {
  try {
    let exchanges = await ExchangeSettings.find()
      .populate({ path: "fees", populate: { path: "firstPair" } })
      .populate({ path: "fees", populate: { path: "secondPair" } })
      .populate({
        path: "exchanges",
        options: { sort: { currency: 1 } },
      });

    let fees = {};
    exchanges[0].fees.forEach((fee) => {
      fees[`${fee.firstPair.currency}/${fee.secondPair.currency}`] = fee.fee;
    });

    exchanges = {
      ...exchanges,
      fees,
    };

    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllMoneyCurrencies = async (req, res) => {
  try {
    let exchanges = await Exchange.find({ type: "money" });

    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addExchange = async (req, res) => {
  const { currency, userId, type } = req.body;
  let image = null;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    let exchange = await ExchangeSettings.findOne({ userId });

    if (!exchange) {
      exchange = new ExchangeSettings({
        userId,
        fee: 0,
        exchanges: [],
        fees: [],
      });
    }

    const existingCurrency = exchange.exchanges.find(
      (exRate) => exRate.currency === currency
    );

    if (existingCurrency) {
      return res.status(200).json({ message: "Exchange already exists" });
    } else {
      if (req.file) {
        let result = await cloudinary.uploader.upload(req.file.path);
        if (result.error) {
          return res.status(500).json({
            message: result.error.message,
            success: false,
          });
        }
        image = result.secure_url.replace("/v" + result.version, "");
      }
      const newExchangeRate = await Exchange.create({
        currency,
        type,
        image,
      });

      exchange.exchanges.push(newExchangeRate);
    }

    const savedExchange = await exchange.save();
    res.json(savedExchange);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editExchange = async (req, res) => {
  const { id } = req.params;
  const { currency, userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const updatedExchange = await Exchange.findByIdAndUpdate(
      id,
      { currency },
      { new: true }
    );

    if (!updatedExchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    res.json(updatedExchange);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteExchange = async (req, res) => {
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
    const deletedExchange = await Exchange.findOneAndDelete({ _id: id });

    if (!deletedExchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    res.json({ message: "Exchange deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllExchanges,
  getAllMoneyCurrencies,
  addExchange,
  editExchange,
  deleteExchange,
};
