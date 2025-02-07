const PagaBusinessClient = require("paga-business");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Crypto = require("../models/Crypto");
const jwt = require("jsonwebtoken");

function getCurrentUtcTimestamp() {
  const now = new Date();
  const utcTimestamp = now.getTime();
  return utcTimestamp;
}

// Usage
const utcTimestamp = getCurrentUtcTimestamp();

const {
  computeHash,
  computeMerchantHash,
  computeMerchantPaymentHash,
  computeTransactionStatusHash,
  computeBankDepositHash,
  computeVerifiedAirtimeHash,
} = require("../utils/functions");
const https = require("https");
const User = require("../models/User");

const pagaBusinessClient = new PagaBusinessClient()
  .setPrincipal(process.env.PRINCIPAL)
  .setCredential(process.env.CREDENTIALS)
  .setApiKey(process.env.PAGA_API_KEY)
  .setIsTest(false)
  .build();

const validateAccountNumber = async (req, res) => {
  const { amount, destinationBankUUID, destinationBankAccountNumber } =
    req.body;

  try {
    const response = await pagaBusinessClient.validateDepositToBank(
      uuidv4(),
      amount,
      "NGN",
      destinationBankUUID,
      destinationBankAccountNumber
    );
    const data = await response.response;
    if (data.responseCode === 139) {
      return res.status(200).json({
        response: {
          message: "Internal server error. Please try again later",
        },
        error: true,
      });
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error(error.response.data);
    return res.status(500).json({
      error:
        "An error occurred while validating your account number. Please look at the number and try again",
    });
  }
};

const getNetworkProviders = async (req, res) => {
  try {
    const response = await pagaBusinessClient.getMobileOperators(
      uuidv4(),
      "locale"
    );
    const data = await response;
    return res.status(200).json({
      ok: true,
      data: data.response,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching network providers" });
  }
};

const getBanks = async (req, res) => {
  try {
    const response = await pagaBusinessClient.getBanks(uuidv4());
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);

    // Handle the error and send an appropriate response
    return res
      .status(500)
      .json({ error: "An error occurred while fetching network providers" });
  }
};

const depositToBank = async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(" ")[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  const {
    amount,
    destinationBankUUID,
    destinationBankAccountNumber,
    recipient,
    remark,
    referenceNum,
  } = req.body;

  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  const userId = decoded.userId;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }

  if (!referenceNum) {
    return res
      .status(404)
      .json({ message: "No reference provided", ok: false });
  }

  const wallet = await Wallet.findOne({ user: user._id });
  if (!wallet) {
    return res
      .status(404)
      .json({ message: "Wallet not found for the user", ok: false });
  }

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

  const hashed = computeBankDepositHash(
    referenceNum,
    amount,
    destinationBankUUID,
    destinationBankAccountNumber,
    process.env.PAGA_API_KEY
  );

  const requestBody = {
    referenceNumber: referenceNum,
    amount: amount,
    currency: "NGN",
    destinationBankUUID: destinationBankUUID,
    destinationBankAccountNumber: destinationBankAccountNumber,
    remarks: remark,
  };
  try {
    const response = await axios.post(
      `${process.env.PAGA_APIURL}/depositToBank`,
      requestBody,
      {
        headers: {
          principal: process.env.PRINCIPAL,
          credentials: process.env.CREDENTIALS,
          hash: hashed,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.data;
    if (data.responseCode === 139) {
      const newTransaction = new Transaction({
        user_id: user._id,
        referenceNumber: data.referenceNumber,
        status: "FAILED",
        transactionReference: data.referenceNumber,
        amount: amount,
        recipient: destinationBankAccountNumber,
        transactionType: `Bank Deposit to ${destinationBankAccountNumber}`,
        transactionId: uuidv4(),
        dateUTC: getCurrentUtcTimestamp(),
      });
      await newTransaction.save();
      return res.status(200).json({
        data: {
          message: "Internal server error. Please try again later",
          error: true,
        },
      });
    }
    if (data.referenceNumber) {
      try {
        const requestBody = {
          referenceNumber: referenceNum,
        };
        const hashedTransaction = computeTransactionStatusHash(
          data.referenceNumber,
          process.env.PAGA_API_KEY
        );
        const response = await axios.post(
          `${process.env.PAGA_APIURL}/transactionStatus`,
          requestBody,
          {
            headers: {
              principal: process.env.PRINCIPAL, // Replace with the actual publicId
              credentials: process.env.CREDENTIALS, // Replace with the actual password
              hash: hashedTransaction,
              "Content-Type": "application/json",
              // 'Content-Length': Buffer.byteLength(requestBodyString),
            },
          }
        );

        const transactionData = await response.data;
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: transactionData.referenceNumber,
          recipient: recipient,
          status: transactionData.status,
          transactionReference: transactionData.transactionReference,
          amount: transactionData.amount,
          fee: transactionData.fee,
          transactionType: `Bank Deposit To ${recipient}`,
          transactionId: transactionData.transactionId,
          dateUTC: transactionData.dateUTC,
        });
        await newTransaction.save();
        if (transactionData.status === "SUCCESSFUL") {
          wallet.balance -= transactionData.amount;
          await wallet.save();
        }
      } catch (error) {
        console.log({ error });
      }
    }

    // wallet.balance -= amount;
    // await wallet.save();
    return res.status(200).json({ data: data, error: false });
  } catch (error) {
    console.error({ error });
    return res
      .status(500)
      .json({ error: "An error occurred while making bank transfer" });
  }
};
const getBundleOperators = async (req, res) => {
  // Extract the user ID, amount, and reference from the request body
  const { userId, operatorCode } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "A valid user is required. please signin", ok: false });
  }
  try {
    const response = await pagaBusinessClient.getDataBundleByOperator(
      uuidv4(),
      operatorCode
    );

    return res.status(200).json({
      ok: true,
      data: response,
      data: {
        error: response.error,
        response: {
          responseCategoryCode: response.response.responseCategoryCode,
          responseCode: response.response.responseCode,
          message: response.response.message,
          mobileOperatorServices: response.response.mobileOperatorServices.map(
            (item) => ({
              validityPeriod: item.validityPeriod,
              mobileOperatorId: item.mobileOperatorId,
              servicePrice: item.servicePrice,
              dataValue: item.dataValue,
              serviceName: item.serviceName,
              serviceId: item.serviceId,
              operatorCode: operatorCode,
            })
          ),
        },
      },
    });
  } catch (error) {
    // Handle the error and send an appropriate response
    return res
      .status(500)
      .json({ error: "An error occurred while fetching network providers" });
  }
};

const buyAirtime = async (req, res) => {
  const { userId, amount, number, reference } = req.body;
  if (!userId) {
    return res
      .status(400)
      .json({ message: "A valid user is required. please signin", ok: false });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(400)
      .json({ message: "User with this ID does not exist", ok: false });
  }

  try {
    if (reference) {
      const response = await pagaBusinessClient.airtimePurchase(
        uuidv4(),
        amount,
        "NGN",
        Number(number)
      );
      console.log(response)
      const data = await response.response;
      if (data.responseCode === 139) {
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: data.referenceNumber,
          status: "FAILED",
          transactionReference: data.referenceNumber,
          amount: amount,
          transactionType: `Airtime Purchase To ${number}`,
          recipient: number,
          transactionId: uuidv4(),
          dateUTC: getCurrentUtcTimestamp(),
        });
        const savedTransaction = await newTransaction.save();
        await Crypto.findOneAndUpdate(
          {
            transactionReference: reference,
          },
          {
            transactionId: savedTransaction._id,
          }
        );
        return res.status(200).json({
          data: {
            message: "Internal server error. Please try again later",
            error: true,
          },
        });
      }
      if (data.referenceNumber) {
        try {
          const requestBody = {
            referenceNumber: data.referenceNumber,
          };
          const hashedTransaction = computeTransactionStatusHash(
            data.referenceNumber,
            process.env.PAGA_API_KEY
          );
          const response = await axios.post(
            `${process.env.PAGA_APIURL}/transactionStatus`,
            requestBody,
            {
              headers: {
                principal: process.env.PRINCIPAL,
                credentials: process.env.CREDENTIALS,
                hash: hashedTransaction,
                "Content-Type": "application/json",
              },
            }
          );

          const transactionData = await response.data;
          const newTransaction = new Transaction({
            user_id: user._id,
            referenceNumber: transactionData.referenceNumber,
            status: transactionData.status,
            transactionReference: transactionData.transactionReference,
            amount: transactionData.amount,
            fee: transactionData.fee,
            transactionType: `Airtime Purchase To ${number}`,
            recipient: number,
            transactionId: transactionData.transactionId,
            dateUTC: transactionData.dateUTC,
          });
          const savedTransaction = await newTransaction.save();
          await Crypto.findOneAndUpdate(
            {
              transactionReference: reference,
            },
            {
              transactionId: savedTransaction._id,
            }
          );
        } catch (error) {
          console.log({ error });
        }
      }
      return res.status(200).json({
        ok: true,
        data: response,
      });
    } else {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        return res
          .status(404)
          .json({ message: "Wallet not found for the user", ok: false });
      }

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
      // const referenceNum =  uuidv4();
      //  const body = {
      //    referenceNumber: referenceNum,
      //    amount: amount,
      //    currency: "NGN",
      //    destinationPhoneNumber: number,
      //    locale: "English",
      //    isSuppressRecipientMessages: true,
      //    isDataBundle: true,
      //  };

      const response = await pagaBusinessClient.airtimePurchase(
        uuidv4(),
        amount,
        "NGN",
        Number(number)
      );
      // const hashedAirtimeVal = computeVerifiedAirtimeHash(referenceNum,amount,number, process.env.PAGA_API_KEY);
      //    const response = await axios.post(
      //      `${process.env.PAGA_APIURL}/airtimePurchase`,
      //      body,
      //      {
      //        headers: {
      //          principal: process.env.PRINCIPAL,
      //          credentials: process.env.CREDENTIALS,
      //          hash: hashedAirtimeVal,
      //          "Content-Type": "application/json",
      //        },
      //      }
      //    );
      const data = await response.response;
      // console.log(data)
      if (data.responseCode === 139) {
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: data.referenceNumber,
          status: "FAILED",
          transactionReference: data.referenceNumber,
          amount: amount,
          transactionType: `Airtime Purchase To ${number}`,
          recipient: number,
          transactionId: uuidv4(),
          dateUTC: getCurrentUtcTimestamp(),
        });
        await newTransaction.save();
        return res.status(200).json({
          data: {
            message: "Internal server error. Please try again later",
            error: true,
          },
        });
      }
      if (data.referenceNumber) {
        try {
          const requestBody = {
            referenceNumber: data.referenceNumber,
          };
          const hashedTransaction = computeTransactionStatusHash(
            data.referenceNumber,
            process.env.PAGA_API_KEY
          );
          const response = await axios.post(
            `${process.env.PAGA_APIURL}/transactionStatus`,
            requestBody,
            {
              headers: {
                principal: process.env.PRINCIPAL, // Replace with the actual publicId
                credentials: process.env.CREDENTIALS, // Replace with the actual password
                hash: hashedTransaction,
                "Content-Type": "application/json",
                // 'Content-Length': Buffer.byteLength(requestBodyString),
              },
            }
          );

          const transactionData = await response.data;
          const newTransaction = new Transaction({
            user_id: user._id,
            referenceNumber: transactionData.referenceNumber,
            status: transactionData.status,
            transactionReference: transactionData.transactionReference,
            amount: transactionData.amount,
            fee: transactionData.fee,
            transactionType: `Airtime Purchase To ${number}`,
            recipient: number,
            transactionId: transactionData.transactionId,
            dateUTC: transactionData.dateUTC,
          });
          await newTransaction.save();
          if (transactionData.status === "SUCCESSFUL") {
            wallet.balance -= transactionData.amount;
            await wallet.save();
          }
        } catch (error) {
          console.log({ error });
        }
      }
      return res.status(200).json({
        ok: true,
        data: response,
      });
    }
  } catch (error) {
    console.error(error.response);

    return res
      .status(500)
      .json({ error: "An error occurred while making the API request" });
  }
};
const getElectricityMerchants = async (req, res) => {
  try {
    const response = await pagaBusinessClient.getMerchants(uuidv4());
    const merchants = await response.response.merchants;

    const filteredMerchants = merchants.filter((merchant) =>
      merchant.name.includes("Electric")
    );
    return res.status(200).json({
      ok: true,
      data: filteredMerchants,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while fetching network providers" });
  }
};
const getTVMerchants = async (req, res) => {
  try {
    const response = await pagaBusinessClient.getMerchants(uuidv4());
    const merchants = await response.response.merchants;

    const filteredMerchants = merchants.filter(
      (merchant) =>
        merchant.name.includes("DStv") || merchant.name.includes("GOtv")
    );
    return res.status(200).json({
      ok: true,
      data: filteredMerchants,
    });
  } catch (error) {
    console.error(error);

    // Handle the error and send an appropriate response
    return res
      .status(500)
      .json({ error: "An error occurred while fetching network providers" });
  }
};

const getMerchantServices = async (req, res) => {
  // Extract the user ID, amount, and reference from the request body
  const { userId, merchantCode } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "A valid user is required. please signin", ok: false });
  }
  try {
    const response = await pagaBusinessClient.getMerchantServices(
      uuidv4(),
      merchantCode
    );
    return res.status(200).json({
      ok: true,
      data: {
        responseCode: response.response.responseCode,
        responseCategoryCode: response.response.responseCategoryCode,
        message: response.response.message,
        referenceNumber: response.response.referenceNumber,
        services: response.response.services.map((item) => ({
          name: item.name,
          code: item.code,
          price: item.price,
          shortCode: item.shortCode,
          serviceName: item.serviceName,
          serviceId: item.serviceId,
          merchantCode: merchantCode,
        })),
      },
    });
  } catch (error) {
    console.error(error);

    // Handle the error and send an appropriate response
    return res
      .status(500)
      .json({ error: "An error occurred while fetching network providers" });
  }
};

const buyData = async (req, res) => {
  const {
    userId,
    operatorCode,
    referenceNum,
    operatorServiceCode,
    amount,
    number,
    reference,
  } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "A valid user is required. please signin", ok: false });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(400)
      .json({ message: "User with this ID does not exist", ok: false });
  }
  if (!referenceNum) {
    return res
      .status(400)
      .json({ message: "A reference number is required", ok: false });
  }
  if (!operatorCode) {
    return res
      .status(400)
      .json({ message: "A valid mobile operator code is required", ok: false });
  }

  if (!operatorServiceCode) {
    return res.status(400).json({
      message: "A valid mobile operator service code is required",
      ok: false,
    });
  }
  const hashed = computeHash(
    referenceNum,
    amount,
    number,
    process.env.PAGA_API_KEY
  );
  if (reference) {
    const requestBody = {
      referenceNumber: referenceNum,
      mobileOperatorPublicId: operatorCode,
      mobileOperatorServiceId: operatorServiceCode,
      amount: amount.toString(),
      currency: "NGN",
      destinationPhoneNumber: number.toString(),
      locale: "",
      isSuppressRecipientMessages: true,
      isDataBundle: true,
    };
    try {
      const response = await axios.post(
        `${process.env.PAGA_APIURL}/airtimePurchase`,
        requestBody,
        {
          headers: {
            principal: process.env.PRINCIPAL,
            credentials: process.env.CREDENTIALS,
            hash: hashed,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.data;
      if (data.responseCode === 139) {
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: data.referenceNumber,
          status: "Failed",
          transactionReference: uuidv4(),
          amount: amount,
          recipient: number,
          transactionType: `Mobile Data Purchase To ${number}`,
          transactionId: uuidv4(),
          dateUTC: getCurrentUtcTimestamp(),
        });
        const savedTransaction = await newTransaction.save();
        await Crypto.findOneAndUpdate(
          {
            transactionReference: reference,
          },
          {
            transactionId: savedTransaction._id,
          }
        );
        return res.status(200).json({
          data: {
            message: "Internal server error. Please try again later",
            error: true,
          },
        });
      }
      if (data.referenceNumber) {
        try {
          const requestBody = {
            referenceNumber: referenceNum,
          };
          const hashedTransaction = computeTransactionStatusHash(
            data.referenceNumber,
            process.env.PAGA_API_KEY
          );
          const response = await axios.post(
            `${process.env.PAGA_APIURL}/transactionStatus`,
            requestBody,
            {
              headers: {
                principal: process.env.PRINCIPAL,
                credentials: process.env.CREDENTIALS,
                hash: hashedTransaction,
                "Content-Type": "application/json",
              },
            }
          );

          const transactionData = await response.data;
          if (transactionData.responseCode === -1) {
            return res.status(400).json({
              message: "Internal server error. Please try again later",
              error: true,
            });
          }
          const newTransaction = new Transaction({
            user_id: user._id,
            referenceNumber: transactionData.referenceNumber,
            status: transactionData.status,
            transactionReference: transactionData.transactionReference,
            amount: transactionData.amount,
            fee: transactionData.fee,
            recipient: number,
            transactionType: `Mobile Data Purchase To ${number}`,
            transactionId: transactionData.transactionId,
            dateUTC: transactionData.dateUTC,
          });
          const savedTransaction = await newTransaction.save();
          await Crypto.findOneAndUpdate(
            {
              transactionReference: reference,
            },
            {
              transactionId: savedTransaction._id,
            }
          );
        } catch (error) {
          console.log({ error });
        }
      }
      return res.status(200).json({
        ok: true,
        data: data,
      });
    } catch (error) {
      console.error(error.response);

      return res
        .status(500)
        .json({ error: "An error occurred while making the API request" });
    }
  } else {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for the user", ok: false });
    }

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
    const requestBody = {
      referenceNumber: referenceNum,
      mobileOperatorPublicId: operatorCode,
      mobileOperatorServiceId: operatorServiceCode,
      amount: amount.toString(),
      currency: "NGN",
      destinationPhoneNumber: number.toString(),
      locale: "",
      isSuppressRecipientMessages: true,
      isDataBundle: true,
    };

    try {
      const response = await axios.post(
        `${process.env.PAGA_APIURL}/airtimePurchase`,
        requestBody,
        {
          headers: {
            principal: process.env.PRINCIPAL,
            credentials: process.env.CREDENTIALS,
            hash: hashed,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.data;
      if (data.responseCode === 139) {
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: data.referenceNumber,
          status: "Failed",
          transactionReference: uuidv4(),
          amount: amount,
          recipient: number,
          transactionType: `Mobile Data Purchase To ${number}`,
          transactionId: uuidv4(),
          dateUTC: getCurrentUtcTimestamp(),
        });
        await newTransaction.save();
        return res.status(200).json({
          data: {
            message: "Internal server error. Please try again later",
            error: true,
          },
        });
      }
      if (data.referenceNumber) {
        try {
          const requestBody = {
            referenceNumber: referenceNum,
          };
          const hashedTransaction = computeTransactionStatusHash(
            data.referenceNumber,
            process.env.PAGA_API_KEY
          );
          const response = await axios.post(
            `${process.env.PAGA_APIURL}/transactionStatus`,
            requestBody,
            {
              headers: {
                principal: process.env.PRINCIPAL,
                credentials: process.env.CREDENTIALS,
                hash: hashedTransaction,
                "Content-Type": "application/json",
              },
            }
          );

          const transactionData = await response.data;
          const newTransaction = new Transaction({
            user_id: user._id,
            referenceNumber: transactionData.referenceNumber,
            status: transactionData.status,
            transactionReference: transactionData.transactionReference,
            amount: transactionData.amount,
            fee: transactionData.fee,
            recipient: number,
            transactionType: `Mobile Data Purchase To ${number}`,
            transactionId: transactionData.transactionId,
            dateUTC: transactionData.dateUTC,
          });
          await newTransaction.save();
          if (transactionData.status === "SUCCESSFUL") {
            wallet.balance -= transactionData.amount;
            await wallet.save();
          }
        } catch (error) {
          console.log({ error });
        }
      }

      return res.status(200).json({
        ok: true,
        data: data,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "An error occurred while making the API request" });
    }
  }
};
const getMerchantAccount = async (req, res) => {
  const {
    userId,
    merchantCode,
    referenceNum,
    merchantReferenceNumber,
    serviceNumber,
  } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "A valid user is required. please signin", ok: false });
  }
  if (!referenceNum) {
    return res
      .status(400)
      .json({ message: "A reference number is required", ok: false });
  }
  if (!merchantCode) {
    return res
      .status(400)
      .json({ message: "A valid merchant code is required", ok: false });
  }

  if (!serviceNumber) {
    return res.status(400).json({
      message: "A valid merchant service code is required",
      ok: false,
    });
  }
  const hashed = computeMerchantHash(
    referenceNum,
    merchantCode,
    merchantReferenceNumber,
    serviceNumber,
    process.env.PAGA_API_KEY
  );

  const requestBody = {
    referenceNumber: referenceNum,
    merchantAccount: merchantCode,
    merchantReferenceNumber: merchantReferenceNumber,
    merchantServiceProductCode: serviceNumber,
  };

  try {
    const response = await axios.post(
      `${process.env.PAGA_APIURL}/getMerchantAccountDetails`,
      requestBody,
      {
        headers: {
          principal: process.env.PRINCIPAL,
          credentials: process.env.CREDENTIALS,
          hash: hashed,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.data;

    return res.status(200).json({
      ok: true,
      data: { merchantCode, merchantReferenceNumber, ...data },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while making the API request" });
  }
};

const payMerchant = async (req, res) => {
  const {
    userId,
    amount,
    merchantCode,
    referenceNum,
    merchantReferenceNumber, //meter number or card number
    serviceNumber,
    reference,
  } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "A valid user is required. please signin", ok: false });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(400)
      .json({ message: "User with this ID does not exist", ok: false });
  }
  if (!referenceNum) {
    return res
      .status(400)
      .json({ message: "A reference number is required", ok: false });
  }
  if (!merchantCode) {
    return res
      .status(400)
      .json({ message: "A valid merchant code is required", ok: false });
  }

  if (!serviceNumber) {
    return res.status(400).json({
      message: "A valid merchant service code is required",
      ok: false,
    });
  }
  const hashed = computeMerchantPaymentHash(
    referenceNum,
    amount,
    merchantCode,
    merchantReferenceNumber,
    process.env.PAGA_API_KEY
  );
  if (reference) {
    try {
      const response = await axios.post(
        `${process.env.PAGA_APIURL}/merchantPayment`,
        requestBody,
        {
          headers: {
            principal: process.env.PRINCIPAL,
            credentials: process.env.CREDENTIALS,
            hash: hashed,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.data;
      if (data.responseCode === -1) {
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: data.referenceNumber,
          status: "FAILED",
          transactionReference: uuidv4(),
          amount: amount,
          recipient: merchantReferenceNumber,
          transactionType: `TV/Electricity Bill Payment`,
          transactionId: uuidv4(),
          dateUTC: getCurrentUtcTimestamp(),
        });
        await newTransaction.save();
        return res.status(200).json({
          data: {
            message: "Internal server error. Please try again later",
            error: true,
          },
        });
      }
      if (data.referenceNumber) {
        try {
          const requestBody = {
            referenceNumber: data.referenceNumber,
          };
          const hashedTransaction = computeTransactionStatusHash(
            data.referenceNumber,
            process.env.PAGA_API_KEY
          );
          const response = await axios.post(
            `${process.env.PAGA_APIURL}/transactionStatus`,
            requestBody,
            {
              headers: {
                principal: process.env.PRINCIPAL,
                credentials: process.env.CREDENTIALS,
                hash: hashedTransaction,
                "Content-Type": "application/json",
              },
            }
          );

          const transactionData = await response.data;
          const newTransaction = new Transaction({
            user_id: user._id,
            referenceNumber: transactionData.referenceNumber,
            status: transactionData.status,
            transactionReference: transactionData.transactionReference,
            amount: transactionData.amount,
            fee: transactionData.fee,
            recipient: merchantReferenceNumber,
            transactionType: `TV/Electricity Bill Payment`,
            transactionId: transactionData.transactionId,
            dateUTC: transactionData.dateUTC,
          });
          await newTransaction.save();
        } catch (error) {
          console.log({ error });
        }
      }
      return res.status(200).json({
        ok: true,
        data: { merchantCode, merchantReferenceNumber, ...data },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "An error occurred while making the API request" });
    }
  } else {
    const wallet = await Wallet.findOne({ user: user._id });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for the user", ok: false });
    }

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

    const requestBody = {
      referenceNumber: referenceNum,
      amount: amount,
      currency: "NGN",
      merchantAccount: merchantCode,
      merchantReferenceNumber: merchantReferenceNumber,
      merchantService: [serviceNumber],
    };

    try {
      const response = await axios.post(
        `${process.env.PAGA_APIURL}/merchantPayment`,
        requestBody,
        {
          headers: {
            principal: process.env.PRINCIPAL,
            credentials: process.env.CREDENTIALS,
            hash: hashed,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.data;
      if (data.responseCode === -1) {
        const newTransaction = new Transaction({
          user_id: user._id,
          referenceNumber: data.referenceNumber,
          status: "FAILED",
          transactionReference: data.referenceNumber,
          amount: amount,
          recipient: merchantReferenceNumber,
          transactionType: `TV/Electricity Bill Payment`,
          transactionId: uuidv4(),
          dateUTC: getCurrentUtcTimestamp(),
        });
        await newTransaction.save();
        return res.status(200).json({
          data: {
            message: "Internal server error. Please try again later",
            error: true,
          },
        });
      }
      if (data.referenceNumber) {
        try {
          const requestBody = {
            referenceNumber: data.referenceNumber,
          };
          const hashedTransaction = computeTransactionStatusHash(
            data.referenceNumber,
            process.env.PAGA_API_KEY
          );
          const response = await axios.post(
            `${process.env.PAGA_APIURL}/transactionStatus`,
            requestBody,
            {
              headers: {
                principal: process.env.PRINCIPAL,
                credentials: process.env.CREDENTIALS,
                hash: hashedTransaction,
                "Content-Type": "application/json",
              },
            }
          );

          const transactionData = await response.data;
          const newTransaction = new Transaction({
            user_id: user._id,
            referenceNumber: transactionData.referenceNumber,
            status: transactionData.status,
            transactionReference: transactionData.transactionReference,
            amount: transactionData.amount,
            fee: transactionData.fee,
            recipient: merchantReferenceNumber,
            transactionType: `TV/Electricity Bill Payment`,
            transactionId: transactionData.transactionId,
            dateUTC: transactionData.dateUTC,
          });
          await newTransaction.save();
          if (transactionData.status === "SUCCESSFUL") {
            wallet.balance -= amount;
            await wallet.save();
          }
        } catch (error) {
          console.log({ error });
        }
      }

      return res.status(200).json({
        ok: true,
        data: data,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "An error occurred while making the API request" });
    }
  }
};






module.exports = {
  getNetworkProviders,
  validateAccountNumber,
  getBundleOperators,
  getElectricityMerchants,
  getTVMerchants,
  getMerchantServices,
  buyAirtime,
  buyData,
  getMerchantAccount,
  payMerchant,
  getBanks,
  depositToBank,
};
