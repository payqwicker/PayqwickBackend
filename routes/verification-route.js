// routes/verificationRoutes.js
const express = require("express");
const router = express.Router();
const {
  selectVerificationMethod,
  faceMatch,
  verifyNIN,
  verifyBVN,
  performLivenessCheck,
  verifySelfieAndID,
  verifyAddress
} = require("../controllers/verification-controller");
const authMiddleware = require("../authMiddleware/authMiddleware");
const upload = require("../config/multer");
const { verifyDocument } = require("../controllers/upload-controller");
const { uploadFields } = require("../config/multerConfig");

// ✅ Route: User selects verification method
router.post("/verify-select", authMiddleware, selectVerificationMethod);

// ✅ Route: NIN verification
router.get("/verify-nin", authMiddleware, verifyNIN);

// ✅ Route: BVN verification
router.get("/verify-bvn", authMiddleware, verifyBVN);

// ✅ Route: Perform Liveness Check (Single Image Upload)
router.post("/verify-liveness-check", upload.single("image"), authMiddleware, performLivenessCheck);

router.post(
    "/verify-selfie-id",
    authMiddleware,
    upload.single("image"),
    verifySelfieAndID
  );

router.post(
    "/verify-document",
    upload.fields([
      { name: "document_front", maxCount: 1 },
      { name: "document_back", maxCount: 1 },
    ]),
    authMiddleware,
    verifyDocument
  );
// ✅ Route: Verify Address (No File Upload)
router.post("/verify-address", verifyAddress);

module.exports = router;
