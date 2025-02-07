const express = require("express");
const {
  initiateCryptoPayment,
  cryptoPaymentCallback,
  callback,
  getCryptoPayment,
  getAllCryptoPayments,
} = require("../controllers/crypto-controller");

const router = express.Router();

router.post("/initiate-payment", initiateCryptoPayment);
router.put("/callback", cryptoPaymentCallback);
router.post("/verify", callback);
router.get("/payments", getAllCryptoPayments);
router.get("/verify/:ref", getCryptoPayment);

module.exports = router;
