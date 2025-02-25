require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Wallet = require("../models/Wallet");
const Transaction = require('../models/Transaction'); // Your transaction mode
const mongoose = require("mongoose");

const PAGA_BASE_URL = process.env.PAGA_BASE_URL;
const PAGA_PUBLIC_KEY = process.env.PAGA_PUBLIC_KEY;
const PAGA_SECRET_KEY = process.env.PAGA_SECRET_KEY;
const PAGA_HMAC_KEY = process.env.PAGA_HMAC_KEY;

// Function to generate HMAC using SHA-512
const generateHMAC = (data) => {
  return crypto.createHmac("sha512", PAGA_HMAC_KEY).update(data).digest("hex");
};

const createWallet = async (params) => {
  try {
    // Use UUIDs for robust uniqueness
    const referenceNumber = `REF-${uuidv4()}`;
    const accountReference = `ACCT_REF-${uuidv4()}`;

    // Build the request data object; optional parameters default to null
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

    // Concatenate fields as per API specification:
    // referenceNumber + accountReference + financialIdentificationNumber + creditBankId +
    // creditBankAccountNumber + callbackUrl + hashKey
    const hmacData = `${referenceNumber}${accountReference}${
      params.bvn || ""
    }${params.creditBankId || ""}${params.creditBankAccountNumber || ""}${
      params.callbackUrl || ""
    }${PAGA_HMAC_KEY}`;
    const hash = generateHMAC(hmacData);

    // Execute the API call to register the persistent payment account
    const response = await axios.post(
      `${PAGA_BASE_URL}registerPersistentPaymentAccount`,
      requestData,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${PAGA_PUBLIC_KEY}:${PAGA_SECRET_KEY}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Hash: hash,
        },
      }
    );

    if (response.data && response.data.accountNumber) {
      // Persist the wallet details into MongoDB
      const newWallet = new Wallet({
        user: new mongoose.Types.ObjectId(params.userId),
        pagaAccountNumber: response.data.accountNumber,
        pagaAccountReference: accountReference,
      });

      await newWallet.save();
      console.log("Wallet Created:", newWallet);
      return newWallet;
    } else {
      // Consistent error propagation for missing account numbers
      throw new Error("Failed to create a wallet with Paga. No account number returned.");
    }
  } catch (error) {
    console.error("Error creating wallet:", error);
    // Standardized error messaging for downstream processing
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "An unknown error occurred during wallet creation."
    );
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

const getBanks = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const { referenceNumber, locale } = req.body;

    // Load configuration from environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;      // Business organization publicId
    const password = process.env.PAGA_SECRET_KEY;        // Business credentials
    const hashKey  = process.env.PAGA_HMAC_KEY;           // Key for hash calculation

    // Compute the SHA‑512 hash: concatenate referenceNumber and hashKey
    const hashString = referenceNumber + hashKey;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Construct the request payload
    const payload = { referenceNumber, locale };

    // Configure HTTP headers as required by the API
    const headers = {
      'principal': publicId,
      'credentials': password,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    // Define the endpoint URL for getBanks
    const url = 'https://www.mypaga.com/paga-webservices/business-rest/secured/getBanks';

    // Make the POST request to the external getBanks API
    const response = await axios.post(url, payload, { headers });

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in getBanks controller:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const depositToBank = async (req, res) => {
  try {
    // Extract deposit details from the request body
    const {
      referenceNumber,
      amount,
      currency = 'NGN',
      destinationBankUUID,
      destinationBankAccountNumber,
      recipientPhoneNumber,
      recipientMobileOperatorCode,
      recipientEmail,
      recipientName,
      suppressRecipientMessage,
      remarks,
      locale
    } = req.body;

    // Use environment variables for configuration
    const baseUrl    = process.env.PAGA_BASE_URL;        // e.g., "https://beta-collect.paga.com/"
    const publicKey  = process.env.PAGA_PUBLIC_KEY;        // "5F476E86-BB47-4E93-9CE0-B61B9F613932"
    const secretKey  = process.env.PAGA_SECRET_KEY;        // "tH8#cBtHRpzRgyM"
    const hmacKey    = process.env.PAGA_HMAC_KEY;          // "ad24e2cf7db248118307bd9a93d9fe13..."

    // Compute the SHA‑512 hash of concatenated parameters with the hmacKey
    const hashString = referenceNumber + amount + destinationBankUUID + destinationBankAccountNumber + hmacKey;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Prepare the payload for the deposit request
    const payload = {
      referenceNumber,
      amount,
      currency,
      destinationBankUUID,
      destinationBankAccountNumber,
      recipientPhoneNumber,
      recipientMobileOperatorCode,
      recipientEmail,
      recipientName,
      suppressRecipientMessage,
      remarks,
      locale
    };

    // Configure the headers using the new environment variables
    const headers = {
      'principal': publicKey,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    // Construct the full URL for the deposit endpoint
    const depositUrl = `${baseUrl}paga-webservices/business-rest/secured/depositToBank`;

    // Make the POST request to the external deposit API endpoint
    const response = await axios.post(depositUrl, payload, { headers });

    // Record the transaction in the database
    // Assumes the external API returns status, transactionReference, and fee
    const transactionData = {
      user_id: req.user ? req.user._id : null, // Assumes user is authenticated; adjust as needed
      referenceNumber,
      status: response.data.status || 'completed',
      transactionReference: response.data.transactionReference || 'N/A',
      amount: parseFloat(amount),
      recipient: recipientName,
      fee: response.data.fee ? parseFloat(response.data.fee) : 0,
      transactionType: 'deposit',
      transactionId: crypto.randomBytes(16).toString('hex') // Unique transaction ID
    };

    // Save the transaction record to MongoDB
    await Transaction.create(transactionData);

    // Return the external API's response
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in depositToBank controller:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getAccountBalance = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const {
      referenceNumber,
      accountPrincipal,
      sourceOfFunds,
      accountCredentials,
      locale
    } = req.body;

    // Load configuration from environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;      // Business organization publicId
    const password = process.env.PAGA_SECRET_KEY;        // Business credentials
    const hashKey  = process.env.PAGA_HMAC_KEY;           // Key used for SHA‑512 hash calculation

    // Compute the SHA‑512 hash by concatenating referenceNumber and hashKey
    const hashString = referenceNumber + hashKey;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Construct the payload for the account balance request
    const payload = {
      referenceNumber,
      accountPrincipal,
      sourceOfFunds,
      accountCredentials,
      locale
    };

    // Setup required HTTP headers
    const headers = {
      'principal': publicId,
      'credentials': password,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    // Define the endpoint URL
    const url = 'https://www.mypaga.com/paga-webservices/business-rest/secured/accountBalance';

    // Execute the POST request to the account balance endpoint
    const response = await axios.post(url, payload, { headers });

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching account balance:', error.message);
    res.status(500).json({ error: error.message });
  }
};



// Base URL for the Paga Business API endpoints (ensure you have the correct one in your env)
const BASE_URL = process.env.PAGA_BASE_URL || "https://www.mypaga.com/paga-webservices/business-rest/secured/";

// Helper function to compute the SHA-512 hash using referenceNumber and your HMAC key
const getHash = (referenceNumber, hashKey) => {
  return crypto.createHash('sha512').update(referenceNumber + hashKey).digest('hex');
};

/**
 * 1. Fetch Billers List (Get Merchants)
 */
const getMerchants = async (req, res) => {
  try {
    const { referenceNumber } = req.body;
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;
    const hash = getHash(referenceNumber, hashKey);

    const payload = { referenceNumber };
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}getMerchants`;
    const response = await axios.post(url, payload, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in getMerchants:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 2. Fetch Biller Services (Get Merchant Services)
 */
const getMerchantServices = async (req, res) => {
  try {
    const { referenceNumber, merchantPublicId } = req.body;
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;
    const hash = getHash(referenceNumber, hashKey);

    const payload = { referenceNumber, merchantPublicId };
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}getMerchantServices`;
    const response = await axios.post(url, payload, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in getMerchantServices:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 3. Validate Customer Reference (Get Merchant Account Details)
 */
const getMerchantAccountDetails = async (req, res) => {
  try {
    const { referenceNumber, merchantAccount, merchantReferenceNumber, merchantServiceProductCode } = req.body;
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;
    const hash = getHash(referenceNumber, hashKey);

    const payload = {
      referenceNumber,
      merchantAccount,
      merchantReferenceNumber,
      merchantServiceProductCode
    };
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}getMerchantAccountDetails`;
    const response = await axios.post(url, payload, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in getMerchantAccountDetails:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 4. Make Bill Payment (Merchant Payment)
 */
const merchantPayment = async (req, res) => {
  try {
    const { referenceNumber, amount, currency, merchantAccount, merchantReferenceNumber, merchantService } = req.body;
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;
    const hash = getHash(referenceNumber, hashKey);

    const payload = {
      referenceNumber,
      amount,
      currency,
      merchantAccount,
      merchantReferenceNumber,
      merchantService  // should be an array of service codes, e.g. ["DSBONPC"]
    };
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}merchantPayment`;
    const response = await axios.post(url, payload, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in merchantPayment:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 5. Check Transaction Status
 */
const transactionStatus = async (req, res) => {
  try {
    const { referenceNumber } = req.body;
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;
    const hash = getHash(referenceNumber, hashKey);

    const payload = { referenceNumber };
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}transactionStatus`;
    const response = await axios.post(url, payload, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in transactionStatus:", error.message);
    res.status(500).json({ error: error.message });
  }
};



module.exports = { getWalletDetails, createWallet, depositToBank, getAccountBalance, getBanks, getMerchants, getMerchantServices,getMerchantAccountDetails,merchantPayment, transactionStatus  }
