const dotenv = require("dotenv");
const { invalidateExpiredOtps } = require("./services/cronJob"); // Assuming this is where your cron job logic is
dotenv.config();
const connectDb = require("./config/dbConnection");
const express = require("express");
const cron = require("node-cron");
const axios = require("axios");
const userRouter = require("./routes/user.route");
const walletRouter = require("./routes/wallet-route");
const pagaRouter = require("./routes/paga-route");
const transactionsRouter = require("./routes/transactions-route");
const exchangeRouter = require("./routes/exchange-route");
const feeRouter = require("./routes/fee-route");
const airtimeExchangeRouter = require("./routes/airtime-exchange-route");
const accountRouter = require("./routes/account-route");
const userAccountRouter = require("./routes/user-account-route");
const coinAddressRouter = require("./routes/coinaddress-route");
const exRequestRouter = require("./routes/ex-request");
const airtimeRequestRouter = require("./routes/airtime-exchange-request");
const kycRouter = require("./routes/kyc-route");
const verificationRouter = require("./routes/verification-route");
const secretRouter = require("./routes/secret-route");
const cryptoRouter = require("./routes/crypto-route");
const prepaidElectricityRouter = require("./routes/prepaid-electricty-route");
const southAfricaRouter = require("./routes/south-africa-route");
const uploadRouter = require("./routes/upload-route");

const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.0.178:8081",
  "http://192.168.0.183:8081",
  "http://0.0.0.0:8081",
  "https://payqwicker.com",
  "https://payqwickerweb.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

dotenv.config();
const app = express();
app.use(express.json(corsOptions));
app.use(cors({ origin: "*" }));
connectDb();

cloudinary.config({
  cloud_name: "dp3a4be7p",
  api_key: "386765738978182",
  api_secret: "vMS6PmZsUYfI33LBPLkxrFf3hbY",
});

app.use("/api/user", userRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/paga", pagaRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/exchange", exchangeRouter);
app.use("/api/fee", feeRouter);
app.use("/api/airtime-exchange", airtimeExchangeRouter);
app.use("/api/account", accountRouter);
app.use("/api/user-account", userAccountRouter);
app.use("/api/coin-address", coinAddressRouter);
app.use("/api/ex", exRequestRouter);
app.use("/api/airtime-exchange-request", airtimeRequestRouter);
app.use("/api/crypto", cryptoRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/secret", secretRouter);
app.use("/api/verify", verificationRouter);
app.use("/api/south-africa", southAfricaRouter);
app.use("/api/upload", uploadRouter)


const port = process.env.PORT || 4000;

// Log file setup
const logFile = path.join(__dirname, "logs", "cronJobLogs.txt");
const createLogDirectory = () => {
  if (!fs.existsSync(path.dirname(logFile))) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
  }
};

// Function to log messages
const logMessage = (message) => {
  createLogDirectory();
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, log);
};

// Start the cron job to invalidate expired OTPs at midnight every day
cron.schedule("0 0 * * *", async () => {
  try {
    logMessage("Cron job started to invalidate expired OTPs.");
    console.log("Running cron job to invalidate expired OTPs...");

    await invalidateExpiredOtps();

    logMessage("Cron job completed successfully: Expired OTPs invalidated.");
    console.log("Cron job completed successfully: Expired OTPs invalidated.");
  } catch (error) {
    const errorMsg = `Error during cron job execution: ${error.message || error}`;
    logMessage(errorMsg);
    console.error(errorMsg);
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running smoothly!" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
