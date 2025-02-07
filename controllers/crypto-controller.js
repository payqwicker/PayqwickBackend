const axios = require("axios");
const Transaction = require("../models/Transaction");
const Crypto = require("../models/Crypto");
const User = require("../models/User");

const API_KEY = process.env.CRYPTO_API_KEY;
const CRYPTO_SIGNATURE = process.env.CRYPTO_SIGNATURE;

function getCurrentUtcTimestamp() {
  const now = new Date();
  const utcTimestamp = now.getTime();
  return utcTimestamp;
}

const payment_method = "bitcoin";
const initiateCryptoPayment = async (req, res) => {
  try {
    const { amount, currency, email, referenceNumber, description } = req.body;

    const user = await User.findOne({ email });

    let curr = await axios.get(
      "https://api.fastforex.io/fetch-one?from=USD&to=NGN&api_key=245b91efbe-478d8a02dd-sbd0ve"
    );

    let usdAmount;

    if (currency === "NGN") {
      usdAmount = amount / curr.data.result["NGN"].toFixed(2);
    } else {
      usdAmount = amount;
    }

    const data = {
      amount: Number(usdAmount).toFixed(2),
      crypto: payment_method,
      metadata: {
        user: email,
        amountInNGN:
          amount === usdAmount ? amount * curr.data.result["NGN"].toFixed(2) : amount,
        amountInUSD: Number(usdAmount).toFixed(2),
        description,
        referenceNumber,
      },
    };

    const response = await axios.post(
      "https://www.poof.io/api/v2/create_invoice",
      data,
      {
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const newCryptoTransaction = await Crypto.create({
      user_id: user._id,
      status: "pending",
      amount: response.data.charge,
      currency: payment_method,
      transactionReference: referenceNumber,
      amountInNGN:
        amount === usdAmount ? amount * curr.data.result["NGN"].toFixed(2) : amount,
      amountInUSD: Number(usdAmount).toFixed(2),
      address: response.data.address,
      description: description,
      dateUTC: getCurrentUtcTimestamp(),
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const callback = async (req, res) => {
  try {
    // const { id } = req.params;

    let data = req.body;
    let final;
    const user = await User.findOne({ email: data.metadata.user });

    // if (CRYPTO_SIGNATURE == data["x-poof-signature"]) {
    const transaction = await Crypto.findOne({
      transactionReference: data.metadata.referenceNumber,
    });

    if (transaction) {
      await Crypto.findByIdAndUpdate(transaction._id, {
        status: data.paid === "yes" ? "success" : data.paid,
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error });
  }
};

const cryptoPaymentCallback = async (req, res) => {
  res.sendStatus(200);
};

const getCryptoPayment = async (req, res) => {
  try {
    const { ref } = req.params;

    const data = await Crypto.findOne({
      transactionReference: ref,
    });

    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(400).json({
        message: "crypto payment with ref number not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getAllCryptoPayments = async (req, res) => {
  let payments = await Crypto.find();

  return res.status(200).json(payments);
};

module.exports = {
  initiateCryptoPayment,
  cryptoPaymentCallback,
  callback,
  getCryptoPayment,
  getAllCryptoPayments,
};