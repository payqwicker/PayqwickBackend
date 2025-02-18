
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");


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


const SANDBOX_URL = "https://sandbox.dojah.io/api/v1/document/analysis";
const LIVE_URL = "https://api.dojah.io/api/v1/document/analysis"; // Use this in production



const verifyDocument = async (req, res) => {
  try {
    const { document_type } = req.body;
    const file = req.file; // Multer handles file upload

    if (!document_type || !file) {
      return res.status(400).json({ message: "Document type and image file are required" });
    }

    // Step 1: Download the image from Cloudinary
    const imageUrl = file.path;
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Step 2: Convert image to Base64
    const imageBase64 = Buffer.from(imageResponse.data).toString("base64");

    // Step 3: Prepare FormData
    const formData = new FormData();
    formData.append("document_type", document_type);
    formData.append("input_type", "file"); // Explicitly specifying input type
    formData.append("image", imageBase64);  // Send Base64 string

    // Step 4: Send request to Dojah
    const response = await axios.post(SANDBOX_URL, formData, {
      headers: {
        "AppId": process.env.DOJAH_APP_ID,
        "Authorization": process.env.DOJAH_SECRET_KEY,
        ...formData.getHeaders(),
      },
    });

    // Step 5: Handle response
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
  