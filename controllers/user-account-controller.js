// controllers/exchangeRateController.js

const User = require("../models/User");
const UserAccount = require("../models/UserAccount");
const virtualAccount = require("../models/virtualAccount")
const Wallet = require("../models/Wallet");
const axios = require('axios')
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const {
  computecreateAccountHash
} = require("../utils/functions");
const PagaCollectClient = require('paga-collect');

  const pagaCollectClient = new PagaCollectClient()
  .setClientId(process.env.PRINCIPAL)
  .setPassword(process.env.CREDENTIALS)
  .setApiKey(process.env.PAGA_API_KEY)
  .setTest(true) //change on build mode to false
  .build();


const getUserAccount = async (req, res) => {
  try {
    let { userId } = req.params;
    let { currency } = req.query;
    const account = await UserAccount.find({ userId, currency });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


/**
 * Generate a UUID with a length between min and max.
 * @param {number} min - Minimum length.
 * @param {number} max - Maximum length.
 * @returns {string} - UUID with specified length.
 */
function generateCustomUUID(min = 12, max = 30) {
  if (min < 1 || max > 36 || min > max) {
    throw new Error('Length range must be between 1 and 36, with min <= max.');
  }

  // Generate a UUID and remove hyphens
  const uuid = uuidv4().replace(/-/g, '');

  // Randomly decide the length between min and max
  const length = Math.floor(Math.random() * (max - min + 1)) + min;

  // Return the UUID substring of the desired length
  return uuid.substring(0, length);
}
// Function to create a persistent account
// const createPersistentAccount = async (req, res, next) => {
//   const authHeader = req.header("Authorization");

//   if (!authHeader) {
//     return res.status(401).json({ message: "No token provided", ok: false });
//   }

//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ message: "No token provided", ok: false });
//   }

//   const { userId } = req.body;
//   if (!userId) {
//     return res.status(400).json({ message: "User ID is required", ok: false });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.SECRET_KEY);
//     if (decoded.userId !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Token does not match user ID", ok: false });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     // Use findOneAndUpdate with upsert option to avoid race conditions
//     // const existingAcc = await virtualAccount.findOneAndUpdate(
//     //   { userId: user.id },
//     //   {},
//     //   { upsert: true, new: true, setDefaultsOnInsert: true }
//     // );
//     const existingAcc = await virtualAccount.findOne({ userId: user.id });
//     //  const existingAcc = await virtualAccount.find({ userId: user.id });
//     if (existingAcc) {
//       return res.status(201).json({ ok: true, data: existingAcc });
//     }

//     //  const callBack = `https://backend-payqwicker-com-5.onrender.com/api/transactions/callback_url`;

//     const callBack = process.env.callBack_URL;
//     const data = {
//       referenceNumber: uuidv4(),
//       phoneNumber: user.phone,
//       email: user.email,
//       userId: user.id,
//       firstName: user.firstName || "DefaultFirstName",
//       lastName: user.lastName || "DefaultLastName",
//       fullName: user.fullName,
//       accountName: user.fullName, //fullname for now
//       accountReference: generateCustomUUID(),
//       callbackUrl: callBack,
//     };
//     console.log(data);
//     // function to create hash value for the paga endpoint
//     const hashed = computecreateAccountHash(
//       data.referenceNumber,
//       data.accountReference,
//       process.env.PAGA_API_KEY,
//       callBack
//     );

//     const details = await axios.post(
//       `https://collect.paga.com/registerPersistentPaymentAccount`,
//       data,
//       {
//         headers: {
//           Authorization: `Basic NUY0NzZFODYtQkI0Ny00RTkzLTlDRTAtQjYxQjlGNjEzOTMyOm1INSU1RHZiTVJFbXN6dw==`,
//           hash: hashed,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log(details)
//     const accountData = {
//       referenceNumber: data.referenceNumber,
//       fullName: data.fullName,
//       userId: data.userId,
//       email: data.email,
//       accountName: data.accountName,
//       phoneNumber: data.phoneNumber,
//       accountNumber: details?.data.accountNumber,
//       accountReference: data.accountReference,
//     };
//     //   const account = new virtualAccount(accountData);
//       // console.log(account)
//     //  await account.save();
//     // Use findOneAndUpdate again to ensure we don't create duplicate entries

//     const account = await virtualAccount.findOneAndUpdate(
//       { userId: user.id },
//       accountData,
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );
//     console.log(account)
//     return res.status(200).json({ ok: true, data: account });
//   } catch (error) {
//     console.error("Error creating persistent account:", error.response?.data || error.message);
//     return res.status(500).json({ error: "Failed to create persistent account" });
//   }
// };


const createPersistentAccount = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required", ok: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Token does not match user ID", ok: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingAcc = await virtualAccount.findOne({ userId: user.id });
    if (existingAcc) {
      return res.status(201).json({ ok: true, data: existingAcc });
    }

    const callBack = process.env.callBack_URL;
    const data = {
      referenceNumber: uuidv4(),
      phoneNumber: user.phone,
      email: user.email,
      userId: user.id,
      firstName: user.firstName || "DefaultFirstName",
      lastName: user.lastName || "DefaultLastName",
      fullName: user.fullName,
      accountName: user.fullName,
      accountReference: generateCustomUUID(),
      callbackUrl: callBack,
    };

    const hashed = computecreateAccountHash(
      data.referenceNumber,
      data.accountReference,
      process.env.PAGA_API_KEY,
      callBack
    );

    // Axios POST with timeout and better error handling
    let details;
    try {
      details = await axios.post(
        `https://collect.paga.com/registerPersistentPaymentAccount`,
        data,
        {
          headers: {
            Authorization: `Basic NUY0NzZFODYtQkI0Ny00RTkzLTlDRTAtQjYxQjlGNjEzOTMyOm1INSU1RHZiTVJFbXN6dw==`,
            hash: hashed,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 seconds timeout
        }
      );
      console.log(details)
    } catch (apiError) {
      console.error(
        "Error communicating with Paga API:",
        apiError.response?.data || apiError.message
      );
      return res
        .status(500)
        .json({ error: "Failed to create persistent account with Paga" });
    }

    const accountData = {
      referenceNumber: data.referenceNumber,
      fullName: data.fullName,
      userId: data.userId,
      email: data.email,
      accountName: data.accountName,
      phoneNumber: data.phoneNumber,
      accountNumber: details?.data?.accountNumber || "Unavailable",
      accountReference: data.accountReference,
    };

    const account = await virtualAccount.findOneAndUpdate(
      { userId: user.id },
      accountData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ ok: true, data: account });
  } catch (error) {
    console.error(
      "Error creating persistent account:",
      error.response?.data || error.message
    );
    return res
      .status(500)
      .json({ error: "Failed to create persistent account" });
  }
};











const getAllVirtualAccounts = async (req, res) => {
  try {
    // let { userId } = req.params;
    const accounts = await virtualAccount.find();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getAllUserAccounts = async (req, res) => {
  try {
    let { userId } = req.params;
    const accounts = await UserAccount.find({ userId });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addAccount = async (req, res) => {
  const { accountName, bankName, accountNumber, userId, currency } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (!currency) {
    return res
      .status(404)
      .json({ message: "Please provide currency", ok: false });
  }

  const account = await UserAccount.find({ userId, currency });

  if (account.length === 4) {
    return res.status(404).json({
      message: "Maximum accounts for selected currency reached",
      ok: false,
    });
  }

  try {
    const newAccount = new UserAccount({
      accountName,
      accountNumber,
      bankName,
      currency,
      userId,
    });

    await newAccount.save();
    res.json(newAccount);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }

  try {
    const deletedAccount = await UserAccount.findOneAndRemove({
      _id: id,
      userId,
    });

    if (!deletedAccount) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteVirtualAccount = async (req, res) => {
  // const { id } = req.params;
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  
  try {
    const deletedAccount = await virtualAccount.deleteMany({ userId })
    if (!deletedAccount) {
      return res.status(404).json({ error: "Address not found" });
    }
 const wallet = await Wallet.findOne({ user: userId });
   if (!wallet) {
     return res.status(403).json({ message: "Wallet not found" });
   }

   // Update wallet balance
  
   wallet.balance = 0;

   await wallet.save();
    res.json({ message: "Persistent Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  addAccount,
  deleteAccount,
  getAllVirtualAccounts,
  getUserAccount,
  getAllUserAccounts,
  deleteVirtualAccount,
  createPersistentAccount
};
