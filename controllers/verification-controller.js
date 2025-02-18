require("dotenv").config();
const User = require("../models/User");
const axios = require("axios");
require('dotenv').config();
const fs = require('fs'); // Make sure to import fs module
const https = require('https');
const FormData = require("form-data");






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


const SELFIE_SANDBOX_URL = "https://sandbox.dojah.io/api/v1/kyc/photoid/verify";
const SELFIE_LIVE_URL = "https://api.dojah.io/api/v1/kyc/photoid/verify"; // Use this in production
const verifySelfieWithID = async (req, res) => {
  try {
    const { id_url, selfie_url, first_name, last_name } = req.body;

    // Validate required fields
    if (!id_url || !selfie_url) {
      return res.status(400).json({
        success: false,
        message: 'id_url and selfie_url are required.',
      });
    }

    // Function to fetch image from URL and convert to Base64
    const fetchImageAsBase64 = async (imageUrl) => {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64String = Buffer.from(response.data, 'binary').toString('base64');
      return base64String;
    };

    // Fetch and convert images
    const photoid_image = await fetchImageAsBase64(id_url);
    const selfie_image = await fetchImageAsBase64(selfie_url);

    // Prepare request payload
    const payload = {
      photoid_image,
      selfie_image,
      first_name, // Optional
      last_name,  // Optional
    };

    // Send request to Dojah API
    const response = await axios.post(
      SELFIE_SANDBOX_URL, // Use SELFIE_LIVE_URL in production
      payload,
      {
        headers: {
          AppId: process.env.DOJAH_APP_ID,
          Authorization: process.env.DOJAH_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // Handle API response
    const { data } = response;
    if (data && data.entity) {
      const { confidence_value, match } = data.entity.selfie;
      if (confidence_value >= 90 && match) {
        return res.json({
          success: true,
          message: 'Selfie verification successful.',
          data: data.entity,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Selfie verification failed. Images do not match.',
          data: data.entity,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Selfie verification failed. Invalid response from Dojah.',
      });
    }
  } catch (error) {
    console.error('Error verifying selfie with ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


const ADDRESS_SANDBOX_URL = "https://sandbox.dojah.io/api/v1/kyc/address";
const ADDRESS_LIVE_URL = "https://api.dojah.io/api/v1/kyc/address"; // Use this in production
const verifyAddress = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, country, state, lga, city, street, house_number } = req.body;

    // ✅ Validate required fields
    if (!first_name || !last_name || !email || !phone || !country || !state || !city || !street || !house_number) {
      return res.status(400).json({
        success: false,
        message: "All required fields (first_name, last_name, email, phone, country, state, city, street, house_number) must be provided.",
      });
    }

    // ✅ Send request to Dojah API
    const response = await axios.post(
      ADDRESS_SANDBOX_URL,
      {
        first_name,
        last_name,
        email,
        phone,
        country,
        state,
        lga,
        city,
        street,
        house_number,
      },
      {
        headers: {
          "AppId": process.env.DOJAH_APP_ID,
          "Authorization": process.env.DOJAH_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Handle API response
    if (response.data && response.data.entity) {
      return res.json({
        success: true,
        data: response.data.entity, // Address verification details
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Address verification failed. Please check the provided details.",
      });
    }
  } catch (error) {
    console.error("Error verifying address:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


const LIVENESS_SANDBOX_URL = "https://sandbox.dojah.io/api/v1/ml/liveness/";
const LIVENESS_LIVE_URL = "https://api.dojah.io/api/v1/ml/liveness/"; // Use this in production
const performLivenessCheck = async (req, res) => {
  try {
    const { input_type } = req.body;
    const file = req.file; // Multer handles file upload

    if (!input_type || !file) {
      return res.status(400).json({ message: "Both input_type and image file are required." });
    }

    // Step 1: Download the image from Cloudinary
    const imageUrl = file.path;
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Step 2: Convert image to Base64
    const imageBase64 = Buffer.from(imageResponse.data).toString("base64");

    // Step 3: Prepare FormData
    const formData = new FormData();
    formData.append("input_type", "file"); // Explicitly specifying input type
    formData.append("image", imageBase64);  // Send Base64 string

    // Step 4: Send request to Dojah
    const response = await axios.post(LIVENESS_SANDBOX_URL, formData, {
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
        data: response.data.entity,  // Liveness check details
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Liveness check failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error performing liveness check:", error.message);

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
  verifyBVN,
  performLivenessCheck,
  verifySelfieWithID,
  verifyAddress
};
