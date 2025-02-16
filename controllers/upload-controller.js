
const axios = require("axios");

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

const reviewDocument = async (req, res) => {
  try {
    const { fileUrl, documentType } = req.body;

    if (!fileUrl || !documentType) {
      return res.status(400).json({ error: "File URL and document type are required" });
    }

    const response = await axios.post(
      "https://api.dojah.io/api/v1/kyc/document_review",
      { image: fileUrl, type: documentType }, 
      {
        headers: {
          "Content-Type": "application/json",
          "AppId": process.env.DOJAH_APP_ID,
          "Authorization": `Bearer ${process.env.DOJAH_SECRET_KEY}`,
        },
      }
    );

    res.json({
      message: "Document sent for review",
      reviewResult: response.data,
    });
  } catch (error) {
    res.status(500).json({
      error: "Review failed",
      details: error.response?.data || error.message,
    });
  }
};


module.exports = {uploadDocument, reviewDocument};
  