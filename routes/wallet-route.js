const express = require('express');
const { getWalletDetails, createWallet, depositToBank, getAccountBalance, } = require('../controllers/wallet-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');

const router = express.Router();

router.get('/details',authMiddleware, getWalletDetails);
router.post('/create', createWallet);
router.post('/deposit', depositToBank)
router.post('/account-balance', getAccountBalance)


module.exports = router;
