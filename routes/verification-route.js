// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const {selectVerificationMethod, faceMatch, verifyNIN, verifyBVN} = require('../controllers/verification-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');
const upload = require('../config/multer');

// Route to handle user ID verification method selection
router.post("/verify-select",authMiddleware, selectVerificationMethod);
router.post("/verify/face-match", authMiddleware, upload.single("file"), faceMatch);
router.get('/verify-nin', verifyNIN);
router.get("/verify-bvn", authMiddleware, verifyBVN);

module.exports = router;
