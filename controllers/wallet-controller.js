const Wallet = require("../models/Wallet");
const jwt = require("jsonwebtoken");
const https = require("https");
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');



const getWallet = async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(" ")[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the user ID from the request body
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required", ok: false });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Extract the user ID from the decoded token
    const tokenUserId = decoded.userId;

    if (tokenUserId !== userId) {
      return res
        .status(403)
        .json({ message: "Token does not match the user ID", ok: false });
    }

    // Retrieve the wallet for the specified user
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for the user", ok: false });
    }

    return res.status(200).json({
      ok: true,
      wallet: {
        id: wallet._id,
        user: wallet.user,
        balance: wallet.balance,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token is invalid", ok: false });
  }
};

const creditWallet = async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(" ")[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the user ID, amount, and reference from the request body
  const { userId, amount, reference } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required", ok: false });
  }

  if (!amount || isNaN(amount)) {
    return res
      .status(400)
      .json({ message: "A valid amount is required", ok: false });
  }

  if (!reference) {
    return res
      .status(400)
      .json({ message: "Payment reference ID is required", ok: false });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Extract the user ID from the decoded token
    const tokenUserId = decoded.userId;

    if (tokenUserId !== userId) {
      return res
        .status(403)
        .json({ message: "Token does not match the user ID", ok: false });
    }

    // Make a request to Paystack's API to verify the payment reference
    const paystackVerifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: paystackVerifyUrl,
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Replace with your Paystack secret key
      },
    };

    // Make the request to Paystack
    const paystackResponse = await new Promise((resolve, reject) => {
      const paystackReq = https.request(options, (paystackRes) => {
        let data = "";
        paystackRes.on("data", (chunk) => {
          data += chunk;
        });
        paystackRes.on("end", () => {
          resolve(JSON.parse(data));
        });
      });
      paystackReq.on("error", (error) => {
        reject(error);
      });
      paystackReq.end();
    });

    // Check the response from Paystack for successful verification
    if (paystackResponse.status === true) {
      // Payment is verified, you can proceed to credit the wallet
      const wallet = await Wallet.findOne({ user: userId });

      if (!wallet) {
        return res
          .status(404)
          .json({ message: "Wallet not found for the user", ok: false });
      }

      if (amount <= 1) {
        return res
          .status(400)
          .json({ message: "Amount must be a positive value", ok: false });
      }

      // Update the wallet balance by adding the amount
      wallet.balance += Number(amount);
      await wallet.save();

      // Return the updated wallet object
      return res.status(200).json({
        ok: true,
        wallet: {
          id: wallet._id,
          user: wallet.user,
          balance: wallet.balance,
        },
      });
    } else {
      // Payment verification failed
      return res
        .status(400)
        .json({ message: "Payment verification failed", ok: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token is invalid", ok: false });
  }
};

const debitWallet = async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(" ")[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the user ID and amount to debit from the request body
  const { userId, amount } = req.body;

  if (!userId || !amount || isNaN(amount)) {
    return res
      .status(400)
      .json({ message: "User ID and a valid amount are required", ok: false });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, "your-secret-key");

    // Extract the user ID from the decoded token
    const tokenUserId = decoded.userId;

    if (tokenUserId !== userId) {
      return res
        .status(403)
        .json({ message: "Token does not match the user ID", ok: false });
    }

    // Retrieve the wallet for the specified user
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for the user", ok: false });
    }

    // Ensure that the amount to debit is a positive value and does not exceed the current balance
    if (amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive value", ok: false });
    }

    if (amount > wallet.balance) {
      return res
        .status(400)
        .json({ message: "Insufficient balance in the wallet", ok: false });
    }

    // Update the wallet balance by subtracting the amount
    wallet.balance -= amount;
    await wallet.save();

    // Return the updated wallet object
    return res.status(200).json({ ok: true, wallet });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token is invalid", ok: false });
  }
};


/**
 * controller function to get user balance from the data base
 * @param {string} reference number
 * @param {string} 
 */

///response handler

// Function to fetch account balance
async function getAccountBalance(req, res, next) {
  
   // Authorization Header 
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided", ok: false });
    }
  
    // Extract the token from the "Authorization" header
    const token = authHeader.split(" ")[1]; // Assuming the header format is "Bearer <token>"
  
    if (!token) {
      return res.status(401).json({ message: "No token provided", ok: false });
    }
  
    // Extract the user ID and amount to debit from the request body
    const { userId} = req.body;
  
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID  required", ok: false });
    }
  try {
   

  // Verify and decode the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Extract the user ID from the decoded token
  const tokenUserId = decoded.userId;

  if (tokenUserId !== userId) {
    return res
      .status(403)
      .json({ message: "Token does not match the user ID", ok: false });
  }
  // Retrieve the wallet for the specified user
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    return res
      .status(404)
      .json({ message: "Wallet not found for the user", ok: false });
  }

 
      // Return the up to date wallet balance.
    return res.status(201).json({ ok: true,
      data: {
      wallet
    }});
    
  } catch (error) {
    console.error('Error fetching account balance:', error.message);
  }
}

// Execute the function


module.exports = {
  creditWallet,
  debitWallet,
  getWallet,
  getAccountBalance
};
