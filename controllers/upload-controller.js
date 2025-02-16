
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      message: "Upload successful",
      fileUrl: req.file.path, // Cloudinary URL
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
};

const SANDBOX_URL = "https://sandbox.dojah.io/api/v1/kyc/document";
const LIVE_URL = "https://api.dojah.io/api/v1/kyc/document"; // Use this in production

const verifyDocument = async (req, res) => {
  try {
    const { document_type } = req.body;
    const file = req.file; // Multer handles file upload

    if (!document_type || !file) {
      return res.status(400).json({ message: "Document type and image file are required" });
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append("document_type", document_type);
    formData.append("input_type", "file"); // Explicitly specifying input type
    formData.append("image", fs.createReadStream(file.path));

    // Send request to Dojah
    const response = await axios.post(SANDBOX_URL, formData, {
      headers: {
        "AppId": process.env.DOJAH_APP_ID,
        "Authorization": process.env.DOJAH_SECRET_KEY,
        ...formData.getHeaders(),
      },
    });

    // Remove uploaded file after request is made
    fs.unlinkSync(file.path);

    // Handle response
    if (response.data && response.data.entity) {
      return res.json({
        success: true,
        data: response.data.entity, // Extracted document details
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Document analysis failed",
      });
    }
  } catch (error) {
    console.error("Error verifying document:", error.message);

    // Cleanup file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


module.exports = {uploadDocument, verifyDocument};
  