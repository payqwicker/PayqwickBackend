const express = require("express");
const router = express.Router();
const {
  getTransactionsByUserId,
  getAllTransactions,
  createTransaction,
  verifyTransaction,
  callBackResponse,
  transactionsHistory
} = require("../controllers/transaction-controller");

// Route to get transactions by user_id

router.post("/all-transactions", getAllTransactions);
router.post("/add-transaction", createTransaction);
router.post("/verify", verifyTransaction);
router.post("/callback_url", callBackResponse);
router.get("/transaction-history/:id", transactionsHistory);
router.get("/:user_id", getTransactionsByUserId);
module.exports = router;
