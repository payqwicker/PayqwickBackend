require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const Wallet = require("../models/Wallet"); // Import Wallet model
const mongoose = require("mongoose");

const PAGA_BASE_URL = process.env.PAGA_BASE_URL;
const PAGA_PUBLIC_KEY = process.env.PAGA_PUBLIC_KEY;
const PAGA_SECRET_KEY = process.env.PAGA_SECRET_KEY;
const PAGA_HMAC_KEY = process.env.PAGA_HMAC_KEY;

const generateHMAC = (data) => {
  return crypto.createHmac("sha512", PAGA_HMAC_KEY).update(data).digest("hex");
};

const createWallet = async (params) => {
  try {
    const referenceNumber = `REF${Date.now()}`;
    const accountReference = `ACCT_REF_${Date.now()}`;

    const requestData = {
      referenceNumber,
      accountName: params.accountName,
      firstName: params.firstName,
      lastName: params.lastName,
      phoneNumber: params.phoneNumber || null,
      email: params.email || null,
      financialIdentificationNumber: params.bvn || null,
      accountReference,
      creditBankId: params.creditBankId || null,
      creditBankAccountNumber: params.creditBankAccountNumber || null,
      callbackUrl: params.callbackUrl || null,
      fundingTransactionLimit: params.fundingTransactionLimit || null,
    };

    // Generate HMAC hash
    const hash = generateHMAC(
      referenceNumber + accountReference + (params.phoneNumber || "") + (params.email || "")
    );

    const response = await axios.post(
      `${PAGA_BASE_URL}/registerPersistentPaymentAccount`,
      requestData,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${PAGA_PUBLIC_KEY}:${PAGA_SECRET_KEY}`).toString("base64")}`,
          "Content-Type": "application/json",
          Hash: hash,
        },
      }
    );

    if (response.data && response.data.accountNumber) {
      // Save Wallet to MongoDB
      const newWallet = new Wallet({
        user: new mongoose.Types.ObjectId(params.userId), // Ensure userId is passed correctly
        pagaAccountNumber: response.data.accountNumber,
        pagaAccountReference: accountReference,
      });

      await newWallet.save();

      console.log("Wallet Created:", newWallet);
      return newWallet;
    } else {
      throw new Error("Failed to create a wallet with Paga.");
    }
  } catch (error) {
    console.error("Error creating wallet:", error);
    return error.response?.data || error.message;
  }
};

const generateHMAC2 = (data) => {
    return crypto.createHmac("sha512", PAGA_HMAC_KEY).update(data).digest("hex");
  };
 
  const sendMoney = async (params) => {
    try {
      const referenceNumber = `PAY${Date.now()}`;
  
      const requestData = {
        referenceNumber,
        amount: params.amount, // Amount to transfer
        currency: "NGN", // Currency is always NGN for Nigeria-based transactions
        destinationBankUUID: params.destinationBankUUID, // Bank identifier (UUID)
        destinationBankAccountNumber: params.destinationBankAccountNumber, // Receiver's account number
        remarks: params.remarks || "", // Optional message for the recipient
      };
  
      // Generate HMAC hash for security
      const hash = generateHMAC2(
        referenceNumber +
          requestData.amount +
          requestData.destinationBankUUID +
          requestData.destinationBankAccountNumber
      );
  
      const response = await axios.post(
        `${PAGA_BASE_URL}/paga-webservices/business-rest/secured/depositToBank`,
        requestData,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${PAGA_PUBLIC_KEY}:${PAGA_SECRET_KEY}`).toString("base64")}`,
            "Content-Type": "application/json",
            Hash: hash,
          },
        }
      );
  
      return response.data;
    } catch (error) {
      console.error("Error in sendMoney:", error);
      return error.response?.data || error.message;
    }
  };

const getWalletDetails = async (req, res) => {
  try {
      const { userId } = req.params;
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
          return res.status(404).json({ success: false, message: "Wallet not found" });
      }
      return res.status(200).json({ success: true, data: wallet });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Error fetching wallet", error: error.message });
  }
};









module.exports = {getWalletDetails, createWallet, sendMoney}
