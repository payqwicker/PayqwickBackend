const express = require("express");
const upload = require("../config/multer");
const { uploadDocument, reviewDocument } = require("../controllers/upload-controller");
const authMiddleware = require("../authMiddleware/authMiddleware");

const router = express.Router();

router.post("/file", authMiddleware, upload.single("file"), uploadDocument);
router.post("/review",authMiddleware, reviewDocument);



module.exports = router;
