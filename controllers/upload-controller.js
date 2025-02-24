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

const verifyDocument = async (req, res) => {
  try {
    const { document_type } = req.body;
    const files = req.files; // Multer stores Cloudinary URLs in req.files

    if (!document_type || !files.document_front) {
      return res.status(400).json({ message: "Document type and front image are required" });
    }

    // Get Cloudinary URLs
    const frontImageUrl = files.document_front[0].path;
    const backImageUrl = files.document_back ? files.document_back[0].path : "";

    // Convert front image to Base64
    const frontImageResponse = await axios.get(frontImageUrl, { responseType: "arraybuffer" });
    const frontImageBase64 = Buffer.from(frontImageResponse.data).toString("base64");

    // Convert back image to Base64 (if provided)
    let backImageBase64 = "";
    if (backImageUrl) {
      const backImageResponse = await axios.get(backImageUrl, { responseType: "arraybuffer" });
      backImageBase64 = Buffer.from(backImageResponse.data).toString("base64");
    }

    // Prepare request payload for Dojah API
    const requestBody = {
      input_type: "base64",
      imagefrontside: frontImageBase64,
      ...(backImageBase64 && { imagebackside: backImageBase64 }), // Include if available
    };

    // Send request to Dojah API
    const response = await axios.post(`${process.env.DOJAH_BASE_URL}/api/v1/document/analysis`, requestBody, {
      headers: {
        "AppId": process.env.DOJAH_APP_ID,
        "Authorization": process.env.DOJAH_SECRET_KEY,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.entity) {
      return res.json({ success: true, data: response.data.entity });
    } else {
      return res.status(400).json({ success: false, message: "Document analysis failed" });
    }
  } catch (error) {
    console.error("Error verifying document:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


module.exports = {uploadDocument, verifyDocument};
  