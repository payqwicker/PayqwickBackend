const express = require("express");
const upload = require("../config/multer");
const { uploadDocument, reviewDocument } = require("../controllers/upload-controller");

const router = express.Router();

router.post("/document", upload.single("file"), uploadDocument);
router.post("/review", reviewDocument);



module.exports = router;
