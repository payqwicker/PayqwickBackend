// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const {selectVerificationMethod} = require('../controllers/verification-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');

// Route to handle user ID verification method selection
router.post("/select",authMiddleware, selectVerificationMethod);

module.exports = router;
