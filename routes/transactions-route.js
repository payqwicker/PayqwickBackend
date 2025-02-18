const express = require("express");
const router = express.Router();
const {
  getTransactionsByUserId,
  getAllTransactions,
  createTransaction,
  verifyTransaction,
  callBackResponse,
  getRecentTransaction
} = require("../controllers/transaction-controller");
const authMiddleware = require("../authMiddleware/authMiddleware");

// Route to get transactions by user_id

router.post("/all-transactions", getAllTransactions);
router.post("/add-transaction", createTransaction);
router.post("/verify", verifyTransaction);
router.post("/callback_url", callBackResponse);
router.get("/history/:userId",authMiddleware, getRecentTransaction);
router.get("/:user_id", getTransactionsByUserId);
module.exports = router;
