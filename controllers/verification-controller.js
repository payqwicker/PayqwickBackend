require("dotenv").config();
const User = require("../models/User");
const axios = require("axios");
require('dotenv').config();





// Controller function to select a verification method (Authenticated)
const selectVerificationMethod = async (req, res) => {
  const { verification_method } = req.body;
  const userId = req.user.userId; // Get user ID from authenticated session

  // Valid verification methods
  const validMethods = ["NIN", "Passport", "Driver’s License", "Voter’s Card"];

  // Validate verification method
  if (!verification_method || !validMethods.includes(verification_method)) {
    return res.status(400).json({ error: "Invalid or missing verification method" });
  }

  try {
    // Find the authenticated user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's verification method
    user.verification_method = verification_method;
    await user.save();

    return res.status(200).json({ message: "Verification method updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

// Controller function to perform face match verification (Authenticated)
const faceMatch = async (req, res) => {
  try {
    const { nin } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!nin) {
      return res.status(400).json({ error: "NIN is required for verification" });
    }

    // Get the uploaded file URL from Cloudinary
    const imageUrl = req.file.path;

    // Send the image & NIN to Dojah for face match
    const response = await axios.post(
      "https://api.dojah.io/api/v1/kyc/face_match",
      { image: imageUrl, id: nin },
      {
        headers: {
          "Content-Type": "application/json",
          "AppId": process.env.DOJAH_APP_ID,
          "Authorization": `Bearer ${process.env.DOJAH_SECRET_KEY}`,
        },
      }
    );

    res.json({
      message: "Face match completed",
      fileUrl: imageUrl,
      verificationResult: response.data,
    });
  } catch (error) {
    res.status(500).json({
      error: "Face match failed",
      details: error.response?.data || error.message,
    });
  }
};

const SANDBOX = `https://sandbox.dojah.io`;
const DOJAH = `https://api.dojah.io`; // Production URL
const verifyNIN = async (req, res) => {
  try {
    const { nin } = req.query; // FIXED: Extract NIN from query parameters
    console.log(req.query);

    if (!nin) {
      return res.status(400).json({ message: "NIN is required" });
    }

    const response = await axios.get(`${SANDBOX}/api/v1/kyc/nin`, {
      headers: {
        'AppId': process.env.DOJAH_APP_ID,
        'Authorization': process.env.DOJAH_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      params: { nin } // Ensure NIN is sent as a query parameter
    });

    if (response.data && response.data.entity) {
      res.json({
        success: true,
        data: response.data.entity
      });
    } else {
      res.status(404).json({
        success: false,
        message: "NIN not found"
      });
    }
  } catch (error) {
    console.error('Error verifying NIN:', error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const BVN_SANDBOX_URL = "https://sandbox.dojah.io/api/v1/kyc/bvn/advance";
const BVN_LIVE_URL = "https://api.dojah.io/api/v1/kyc/bvn/advance"; // Use this in production
const verifyBVN = async (req, res) => {
  try {
    const { bvn } = req.query; // Get BVN from query params

    if (!bvn) {
      return res.status(400).json({ message: "BVN is required" });
    }

    const response = await axios.get(BVN_SANDBOX_URL, {
      headers: {
        "AppId": process.env.DOJAH_APP_ID,
        "Authorization": process.env.DOJAH_SECRET_KEY,
        "Content-Type": "application/json",
      },
      params: { bvn },
    });

    if (response.data && response.data.entity) {
      // BVN is valid
      return res.json({
        success: true,
        data: response.data.entity, // BVN details
      });
    } else {
      // BVN verification failed, request a supporting document
      return res.status(400).json({
        success: false,
        message: "BVN verification failed. Please upload a supporting document such as a bank statement.",
        required_document: "Bank Statement",
      });
    }
  } catch (error) {
    console.error("Error verifying BVN:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};





module.exports = {
  selectVerificationMethod,
  verifyNIN,
  faceMatch,
  verifyBVN
};
