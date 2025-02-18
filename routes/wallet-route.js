const express = require('express');
const { getWallet, creditWallet, getWalletBalance } = require('../controllers/wallet-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');
// const authMiddleWare = require('../authMiddleware/authMiddleware');

const router = express.Router();

router.post('/get', getWallet);
router.put('/credit', creditWallet);
router.get('/account-balance', authMiddleware, getWalletBalance)

module.exports = router;
