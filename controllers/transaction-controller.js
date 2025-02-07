const Transaction = require("../models/Transaction");
const User = require("../models/User");
const axios = require("axios");
const crypto = require("crypto");
// import { createHash } from "crypto";
const virtualAccount = require("../models/virtualAccount");
const Wallet = require("../models/Wallet");
const nodemailer = require("nodemailer");
const {
  computeVerifiedHash,
  createHashToCompare,
  computeToCompareHash
} = require("../utils/functions");
const TransactionHistory = require("../models/TransactionHistory");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const getAllTransactions = async (req, res, next) => {
  const { adminId } = req.body;

  try {
    const requestingUser = await User.findById(adminId);
    if (!requestingUser || requestingUser.userType !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized access", ok: false });
    }
    const transactions = await Transaction.find();
    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions", ok: false });
    } else {
      return res.status(200).json({ transactions, ok: true });
    }
  } catch (error) {
    console.log(error);
  }
};

async function createTransaction(req, res) {
  try {
    // Extract transaction data from the request body
    const {
      user_id,
      adminId,
      referenceNumber,
      status,
      transactionReference,
      amount,
      fee,
      transactionType,
      transactionId,
      dateUTC,
    } = req.body;
    const user = await User.findById(adminId);

    if (!user) {
      return res.status(404).json({ message: "User not found", ok: false });
    }
    if (user.userType !== "admin") {
      return res.status(404).json({ message: "Unauthorized User", ok: false });
    }
    // Create a new transaction instance
    const newTransaction = new Transaction({
      user_id,
      referenceNumber,
      status,
      transactionReference,
      amount,
      fee,
      transactionType,
      transactionId,
      dateUTC,
    });

    // Save the transaction to the database
    const savedTransaction = await newTransaction.save();

    // Respond with the saved transaction
    res.status(201).json(savedTransaction);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
const getTransactionsByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const transactions = await Transaction.find({ user_id});

    if (!transactions) {
      return res
        .status(404)
        .json({ message: "Transactions not found for this user_id" });
    }
    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyTransaction = async (req, res) => {
  try {
    const { ref } = req.body;
    if (!ref)
      return res.status(404).json({ message: "Reference number is required" });

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Transaction verified",
      data: await response.data,
    });
  } catch (error) {
    console.log();
    return res.status(500).json({
      succes: false,
      message: error.response.data.message,
    });
  }
};



// callback response from PAGA
// const callBackResponse = async (req, res) => {

//   try {
//       // make a get request to the callback url
//       const paymentResponse = await axios.get(`${process.env.callBack_URL}`);
//       console.log(paymentResponse);
//       const responseData = paymentResponse.data

//       if (!responseData) {
//         return res.status(400).json({ error: "No data Found" });
        
//       }
//       // console.log(responseData)
//       const statusCode = responseData.statusCode
//       const createdHash = computeVerifiedHash(statusCode,
//          responseData.accountNumber, 
//          responseData.amount, responseData.clearingFeeAmount, responseData.transferFeeAmount, process.env.PAGA_API_KEY)
      
//       if (responseData.hash !== createdHash) {
//         return res.status(401).json({ error: "UnAuthorized Token" });
//       } 
//       const checkAccount = await virtualAccount.findOne({accountNumber: responseData.accountNumber})

//       if (!checkAccount) {
//         return res.status(404).json({ error: "No User with that account number" });
        
//       }
//       // console.log(checkAccount)
//       const acc_userId = checkAccount.userId
//       const wallet = await Wallet.findOne({ user:  acc_userId });

//       if (!wallet) {
//         return res.status(403).json({ message: "Wallet not found", ok: false });
//       }

//       const parseBalanceVal = +responseData.amount;
//       const updateWallet = wallet.balance += parseBalanceVal;
//           //  if (wallet )
//         //  console.log(updateWallet)
//         // const walletFound = await wallet.balance:parseBalanceVal
//       await wallet.save();
//       // transport the email
//       const transporter = nodemailer.createTransport({
//         service: "Gmail",
//         auth: {
//           user: process.env.AUTH_EMAIL, // Your Gmail email address
//           pass: process.env.AUTH_PASS, // Use an App Password generated from your Gmail account settings (more secure)
//         },
//       });
//       const mailOptions = {
//         from: process.env.AUTH_EMAIL,
//         to: email,
//         subject: "Transaction Succesfully Recieved",
//         text: `Dear customer your wallet was Funded with the sum of : ${parseBalanceVal} Naira`,
//       };

//       transporter.sendMail(mailOptions, (err, info) => {
//         if (err) {
//           res.status(500).json({ err });
//         }
//         if (info) {
//           res.status(201).json({ message: "You should receive an email" });
//         }
//       });
//       // return res.status(401).json({
//       //   message: "Account is not verified",
//       //   ok: false,
//       // });
    
//         return res.status(200).json({
//             status: "SUCCESS",
//         });
//    } catch (error) {
//     console.log(error);
//    }
// }


const callBackResponse = async (req, res) => {
  
  try {
    const {
      statusCode,
      accountNumber,
      amount,
      payerDetails,
      transactionReference,
      clearingFeeAmount,
      hash,
    } = req.body;
   
    const sharedKey = process.env.PAGA_API_KEY; // Your pre-shared hash key
 

    // Check if all required fields are present
    if (
      !statusCode ||
      !accountNumber ||
      !amount ||
      !transactionReference ||
      !hash
    ) {
      return res
        .status(400)
        .json({ message: "Invalid request, missing required fields." });
    }

    
    const string = statusCode+accountNumber+amount+clearingFeeAmount+sharedKey
    
    const chash = crypto.createHash("sha512").update(string).digest("hex");
    // console.log(hash);
    // console.log(chash);
    if (hash !== chash) {
      return res.status(401).json({ error: "Unauthorized Token" });
    }
   

    // Find virtual account
    const checkAccount = await virtualAccount.findOne({ accountNumber });
    if (!checkAccount) {
      return res
        .status(404)
        .json({ error: "No User with that account number" });
    }
    // console.log(checkAccount);
    const acc_userId = checkAccount.userId;
    const wallet = await Wallet.findOne({ user: acc_userId });
    if (!wallet) {
      return res.status(403).json({ message: "Wallet not found" });
    }

    // Update wallet balance
    const parseBalanceVal = +amount;
    wallet.balance += parseBalanceVal;
    
    await wallet.save();

    //updating the transaction table
    
    // Create a new transaction instance
    const newTransaction = new TransactionHistory({
      name: payerDetails.payerName,
      amount: parseBalanceVal,
      status: statusCode === "0" ? "success" : "Failed",
      userId: acc_userId,
      transactionDate: new Date(),
    });
    // // Save the transaction to the database
    // console.log(newTransaction)

    await newTransaction.save();

    // Respond with the saved transaction
    // res.status(201).json(transactionHistory);
    // Send email notification
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: checkAccount.email,
      subject: "Transaction Successfully Received",
      text: `Dear customer, your wallet was funded with the sum of ${parseBalanceVal} NGN.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Email Error:", err);
        return res.status(500).json({ error: "Error sending email" });
      }
    });

    return res.status(200).json({ status: "SUCCESS" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const transactionsHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const transactionHistory = await TransactionHistory.find({
      userId: id,
    }).sort({ transactionDate: -1 });
    if (!transactionHistory || transactionHistory.length === 0) {
      return res
        .status(403)
        .json({ message: "No transaction found", ok: false });
    }
    return res.status(200).json({ transactionHistory, ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};
module.exports = {
  getTransactionsByUserId,
  getAllTransactions,
   transactionsHistory,
  createTransaction,
  verifyTransaction,
  callBackResponse
};
