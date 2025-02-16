
const axios = require("axios");
const SANDBOX_URL = "https://sandbox.dojah.io/api/v1/kyc/document";
const LIVE_URL = "https://api.dojah.io/api/v1/kyc/document"; // Use this in production

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

const verifyDocument = async (req, res) => {
  try {
    const { document_type, image } = req.body;

    if (!document_type || !image) {
      return res.status(400).json({ message: "Document type and image are required" });
    }

    const response = await axios.post(SANDBOX_URL, 
      { document_type, image }, 
      {
        headers: {
          "AppId": process.env.DOJAH_APP_ID,
          "Authorization": process.env.DOJAH_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


module.exports = {uploadDocument, verifyDocument};
  