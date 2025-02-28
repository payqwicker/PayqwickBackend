require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Wallet = require("../models/Wallet");
const Transaction = require('../models/Transaction'); // Your transaction mode

// Helper function to compute the SHA-512 hash using referenceNumber and your HMAC key
const getHash = (referenceNumber, hashKey) => {
  return crypto.createHash('sha512').update(referenceNumber + hashKey).digest('hex');
};


const getBanks = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const { referenceNumber, locale } = req.body;

    // Check if the required fields are provided
    if (!referenceNumber || !locale) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Both referenceNumber and locale are required.'
      });
    }

    // Load configuration from environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;      // Business organization publicId
    const password = process.env.PAGA_SECRET_KEY;        // Business credentials
    const hashKey  = process.env.PAGA_HMAC_KEY;           // Key for hash calculation

    // Validate environment variables
    if (!publicId || !password || !hashKey) {
      return res.status(500).json({
        message: 'Missing Paga API credentials',
        error: 'Please ensure PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, and PAGA_HMAC_KEY are set in your environment variables.'
      });
    }

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
    const url = 'https://www.mypaga.com/paga-webservices/business-rest/secured/getBanks'; // Ensure correct URL

    // Make the POST request to the external getBanks API
    const response = await axios.post(url, payload, { headers });

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in getBanks controller:', error.message);
    res.status(500).json({ message: 'An error occurred while fetching banks', error: error.message });
  }
};

const getMerchants = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const { referenceNumber, locale } = req.body;

    // Check if the required fields are provided
    if (!referenceNumber || !locale) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Both referenceNumber and locale are required.'
      });
    }

    // Load configuration from environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const password = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;

    // Validate environment variables
    if (!publicId || !password || !hashKey) {
      return res.status(500).json({
        message: 'Missing Paga API credentials',
        error: 'Please ensure PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, and PAGA_HMAC_KEY are set in your environment variables.'
      });
    }

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

    // Define the endpoint URL for getMerchants
    const url = 'https://www.mypaga.com/paga-webservices/business-rest/secured/getMerchants';

    // Make the POST request to the external getMerchants API
    const response = await axios.post(url, payload, { headers });

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in getMerchants:", error.message);
    res.status(500).json({ message: 'An error occurred while fetching merchants', error: error.message });
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

const getMerchantAccountDetails = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const { referenceNumber, merchantAccount, merchantReferenceNumber, merchantServiceProductCode = '' } = req.body;

    // Load environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;
    const baseUrl = process.env.PAGA_BASE_URL;

    // Validate environment variables
    if (!publicId || !secretKey || !hashKey || !baseUrl) {
      return res.status(500).json({
        message: 'Missing Paga API credentials',
        error: 'Ensure PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, PAGA_HMAC_KEY, and PAGA_BASE_URL are set in environment variables.'
      });
    }

    // Compute the SHA-512 hash using the correct format
    const hashString = referenceNumber + merchantAccount + merchantReferenceNumber + merchantServiceProductCode + hashKey;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Construct the request payload
    const payload = {
      referenceNumber,
      merchantAccount,
      merchantReferenceNumber,
      merchantServiceProductCode
    };

    // Configure HTTP headers as required by the API
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    // Define the endpoint URL for getMerchantAccountDetails
    const url = `https://www.mypaga.com/paga-webservices/business-rest/secured/getMerchantAccountDetails`;

    // Make the POST request to the external API
    const response = await axios.post(url, payload, { headers });

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in getMerchantAccountDetails:", error.message);
    res.status(500).json({
      message: 'An error occurred while fetching merchant account details',
      error: error.message
    });
  }
};

const getMerchantServices = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const { referenceNumber, merchantPublicId } = req.body;

    // Check if required fields are provided
    if (!referenceNumber || !merchantPublicId) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Both referenceNumber and merchantPublicId are required.'
      });
    }

    // Load configuration from environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;

    // Validate environment variables
    if (!publicId || !secretKey || !hashKey) {
      return res.status(500).json({
        message: 'Missing Paga API credentials',
        error: 'Please ensure PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, PAGA_HMAC_KEY, and PAGA_BASE_URL are set in environment variables.'
      });
    }

    // Compute the SHA‑512 hash using the correct format
    const hashString = referenceNumber + merchantPublicId + hashKey;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Construct the request payload
    const payload = { referenceNumber, merchantPublicId };

    // Configure HTTP headers as required by the API
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    // Define the endpoint URL for getMerchantServices
    const url = `https://www.mypaga.com/paga-webservices/business-rest/secured/getMerchantServices`;
    

    // Make the POST request to the external getMerchantServices API
    let response;
    try {
      response = await axios.post(url, payload, { headers });
    } catch (apiError) {
      console.error("Error calling Paga API:", apiError.response?.data || apiError.message);
      return res.status(apiError.response?.status || 500).json({
        message: 'Paga API error',
        error: apiError.response?.data || apiError.message
      });
    }

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in getMerchantServices:", error.response?.data || error.message);
    res.status(500).json({
      message: 'An error occurred while fetching merchant services',
      error: error.message
    });
  }
};


const createWallet = async (req, res) => {
  try {
    const {
      referenceNumber,
      accountName,
      firstName,
      lastName,
      accountReference,
      financialIdentificationNumber,
      phoneNumber,
      email,
      callbackUrl,
    } = req.body;

    // ✅ Validate required fields
    if (!referenceNumber || !accountName || !firstName || !lastName || !accountReference || !financialIdentificationNumber) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'referenceNumber, accountName, firstName, lastName, accountReference, and financialIdentificationNumber are required.',
      });
    }

    // ✅ Validate at least one contact method
    if (!phoneNumber && !email) {
      return res.status(400).json({
        message: 'Contact information required',
        error: 'Either phoneNumber or email must be provided.',
      });
    }

    // ✅ Validate accountReference length
    if (accountReference.length < 12 || accountReference.length > 30) {
      return res.status(400).json({
        message: 'Invalid accountReference length',
        error: 'accountReference must be between 12 and 30 characters long.',
      });
    }

    // ✅ Load environment variables
    const apiUrl = `${process.env.PAGA_BASE_URL}registerPersistentPaymentAccount`;
    const publicKey = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hmacKey = process.env.PAGA_HMAC_KEY;

    if (!publicKey || !secretKey || !hmacKey) {
      return res.status(500).json({
        message: 'Missing Paga API credentials',
        error: 'Ensure PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, and PAGA_HMAC_KEY are set in environment variables.',
      });
    }

    // ✅ Hash Generation - Using HMAC-SHA512
    const hashString = `${referenceNumber}|${accountReference}|${financialIdentificationNumber}`;
    const hash = crypto.createHmac('sha512', hmacKey).update(hashString).digest('hex');

    console.log('🔹 Hash String:', hashString);
    console.log('🔹 Generated Hash:', hash);

    // ✅ API Request Headers
    const headers = {
      'Content-Type': 'application/json',
      'principal': publicKey,
      'credentials': secretKey,
      'hash': hash,
    };

    // ✅ API Request Body
    const data = {
      referenceNumber,
      accountName,
      firstName,
      lastName,
      accountReference,
      financialIdentificationNumber,
      phoneNumber,
      email,
      callbackUrl,
    };

    console.log('🔹 Sending request to Paga:', apiUrl);
    console.log('🔹 Headers:', headers);
    console.log('🔹 Payload:', JSON.stringify(data));

    // ✅ Make API request
    const response = await axios.post(apiUrl, data, { headers });

    console.log('🔹 Paga Response:', response.data);

    // ✅ Handle API Response
    if (response.data && response.data.statusCode === '0' && response.data.statusMessage === 'success') {
      const { accountReference, accountNumber } = response.data;

      // ✅ Save wallet to DB
      const wallet = new Wallet({
        user: req.user._id,
        pagaAccountNumber: accountNumber,
        pagaAccountReference: accountReference,
        balance: 0,
        currency: 'NGN',
        isActive: true,
      });

      await wallet.save();

      return res.status(201).json({
        message: 'Account created successfully!',
        wallet,
      });
    } else {
      return res.status(400).json({
        message: 'Failed to create account',
        error: response.data.statusMessage || 'Unknown error',
      });
    }
  } catch (error) {
    console.error('❌ Error creating wallet:', error.response?.data || error.message);

    return res.status(500).json({
      message: 'An error occurred while creating the account',
      error: error.response?.data || error.message,
    });
  }
};





const merchantPayment = async (req, res) => {
  try {
    // Extract required parameters from the request body
    const { referenceNumber, amount, currency, merchantAccount, merchantReferenceNumber, merchantService, locale } = req.body;

    // Validate required fields
    if (!referenceNumber || !amount || !currency || !merchantAccount || !merchantReferenceNumber || !merchantService || !locale) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'referenceNumber, amount, currency, merchantAccount, merchantReferenceNumber, merchantService, and locale are required.'
      });
    }

    // Load configuration from environment variables
    const publicId = process.env.PAGA_PUBLIC_KEY;
    const secretKey = process.env.PAGA_SECRET_KEY;
    const hashKey = process.env.PAGA_HMAC_KEY;

    // Validate environment variables
    if (!publicId || !secretKey || !hashKey) {
      return res.status(500).json({
        message: 'Missing Paga API credentials',
        error: 'Ensure PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, and PAGA_HMAC_KEY are set in environment variables.'
      });
    }

    // Convert merchantService array to a comma-separated string
    const merchantServiceStr = merchantService.join(",");

    // Ensure amount is formatted correctly
    const amountStr = parseFloat(amount).toFixed(2); // Format amount to two decimal places

    // Compute the SHA-512 hash using the correct format
    const hashComponents = [
      referenceNumber.trim(),
      merchantAccount.trim(),
      merchantReferenceNumber.trim(),
      merchantServiceStr.trim(),
      amountStr,
      currency.trim(),
      locale.trim(),
      hashKey.trim()
    ];
    const hashString = hashComponents.join(""); // Concatenate with no spaces
    const hash = crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');

    // Debug: Log the hash string and computed hash
    console.log("Hash String:", hashString);
    console.log("Computed Hash:", hash);

    // Construct the request payload
    const payload = {
      referenceNumber,
      amount: amountStr,
      currency,
      merchantAccount,
      merchantReferenceNumber,
      merchantService,
      locale
    };

    // Configure HTTP headers as required by the API
    const headers = {
      'principal': publicId,
      'credentials': secretKey,
      'hash': hash,
      'Content-Type': 'application/json'
    };

    // Define the endpoint URL for merchantPayment
    const url = `https://www.mypaga.com/paga-webservices/business-rest/secured/merchantPayment`;

    // Make the POST request to the external API
    let response;
    try {
      response = await axios.post(url, payload, { headers });
    } catch (apiError) {
      console.error("Error calling Paga API:", apiError.response?.data || apiError.message);
      return res.status(apiError.response?.status || 500).json({
        message: 'Paga API error',
        error: apiError.response?.data || apiError.message
      });
    }

    // Return the API response to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in merchantPayment:", error.response?.data || error.message);
    res.status(500).json({
      message: 'An error occurred while processing the merchant payment',
      error: error.message
    });
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

const transferByTag = async (req, res) => {
  try {
    const { senderId, recipientTag, amount } = req.body;

    // Validate input
    if (!senderId || !recipientTag || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Fetch sender
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    // Fetch recipient using payqwickerTag
    const recipient = await User.findOne({ payqwickerTag: recipientTag });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Prevent self-transfer
    if (sender.payqwickerTag === recipientTag) {
      return res.status(400).json({ message: 'You cannot send money to yourself' });
    }

    // Fetch sender wallet
    const senderWallet = await Wallet.findOne({ user: sender._id });
    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Fetch recipient wallet
    const recipientWallet = await Wallet.findOne({ user: recipient._id });
    if (!recipientWallet) {
      return res.status(404).json({ message: 'Recipient wallet not found' });
    }

    // Generate transaction references
    const transactionRef = uuidv4();
    const senderTransactionId = uuidv4();
    const recipientTransactionId = uuidv4();

    // Deduct amount from sender
    senderWallet.balance -= amount;
    await senderWallet.save();

    // Credit recipient
    recipientWallet.balance += amount;
    await recipientWallet.save();

    // Log sender transaction
    await Transaction.create({
      user_id: sender._id,
      referenceNumber: transactionRef,
      status: 'completed',
      transactionReference: transactionRef,
      amount,
      recipient: recipientTag,
      transactionType: 'transfer',
      transactionId: senderTransactionId,
      fee: 0,
    });

    // Log recipient transaction
    await Transaction.create({
      user_id: recipient._id,
      referenceNumber: transactionRef,
      status: 'completed',
      transactionReference: transactionRef,
      amount,
      recipient: sender.payqwickerTag,
      transactionType: 'deposit',
      transactionId: recipientTransactionId,
      fee: 0,
    });

    return res.status(200).json({ message: 'Transfer successful', transactionRef });

  } catch (error) {
    console.error('Transfer Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



const getTransactionsByTag = async (req, res) => {
  try {
    const { tag } = req.query;

    // Validate tag parameter
    if (!tag) {
      return res.status(400).json({ message: 'Payqwicker Tag is required' });
    }

    // Fetch user by Payqwicker Tag
    const user = await User.findOne({ payqwickerTag: tag });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch transactions linked to the user
    const transactions = await Transaction.find({ user_id: user._id }).sort({ dateUTC: -1 });

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};






module.exports = { 
  getWalletDetails, 
  createWallet, 
  depositToBank, 
  getAccountBalance, 
  getBanks, 
  getMerchants, 
  getMerchantServices,
  getMerchantAccountDetails,
  merchantPayment, 
  transactionStatus,
  transferByTag,
  getTransactionsByTag

}
