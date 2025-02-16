const express = require("express");
const upload = require("../config/multer");
const { uploadDocument, verifyDocument } = require("../controllers/upload-controller");
const authMiddleware = require("../authMiddleware/authMiddleware");

const router = express.Router();

router.post("upload/file", authMiddleware, upload.single("file"), uploadDocument);
router.post("/verify-document",authMiddleware, verifyDocument);



module.exports = router;
