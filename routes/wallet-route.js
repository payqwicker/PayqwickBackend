const express = require('express');
const { getWalletDetails, createWallet, sendMoney, } = require('../controllers/wallet-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');

const router = express.Router();

router.get('/details',authMiddleware, getWalletDetails);
router.post('/create', authMiddleware, createWallet);
router.post('/send-money',authMiddleware, sendMoney)

module.exports = router;
