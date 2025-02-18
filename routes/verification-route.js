// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const {selectVerificationMethod, faceMatch, verifyNIN, verifyBVN, performLivenessCheck, verifySelfieWithID, verifyAddress} = require('../controllers/verification-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');
const upload = require('../config/multer');
const { verifyDocument } = require('../controllers/upload-controller');

// Route to handle user ID verification method selection
router.post("/verify-select",authMiddleware, selectVerificationMethod);
router.get('/verify-nin', verifyNIN);
router.get("/verify-bvn", verifyBVN);
router.post("/verify-document", upload.single("image"), verifyDocument);
router.post("/verify-liveness-check", upload.single("image"), performLivenessCheck);
router.post("/verify-selfie", verifySelfieWithID);
router.post("/verify-address", verifyAddress);

module.exports = router;
