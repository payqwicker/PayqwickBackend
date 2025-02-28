const express = require('express');
const { getWalletDetails, createWallet, depositToBank, getAccountBalance, getBanks, getMerchants, getMerchantServices, getMerchantAccountDetails, merchantPayment, } = require('../controllers/wallet-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');

const router = express.Router();

router.get('/details',authMiddleware, getWalletDetails);
// router.post('/registerPersistentPaymentAccount', createWallet);
router.post('/deposit', depositToBank)
router.post('/account-balance', getAccountBalance)
router.post("/get-banks", getBanks)
router.post("/get-merchant", getMerchants)
router.post("/get-merchant-services", getMerchantServices)
router.post("/get-merchant-account", getMerchantAccountDetails)
router.post("/pay-merchant", merchantPayment)

module.exports = router;
