const express = require('express');
const { getWallet, creditWallet, getAccountBalance } = require('../controllers/wallet-controller');
// const authMiddleWare = require('../authMiddleware/authMiddleware');

const router = express.Router();

router.post('/get', getWallet);
router.put('/credit', creditWallet);
router.get('/accountBalance', getAccountBalance)
module.exports = router;
