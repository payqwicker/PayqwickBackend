// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const {selectVerificationMethod, verifyNIN, faceMatch} = require('../controllers/verification-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');
const upload = require('../config/multer');

// Route to handle user ID verification method selection
router.post("/select",authMiddleware, selectVerificationMethod);
router.post("/nin", verifyNIN);
router.post("/face-match", upload.single("file"), faceMatch);

module.exports = router;
