const express = require('express');
const {
  submitKYC,
  verifyKYC
} = require('../controllers/kyc-controller');

const router = express.Router();

router.post('/submit', submitKYC);
router.post('/verify', verifyKYC);

module.exports = router;