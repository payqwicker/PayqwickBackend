require("dotenv").config();
const User = require("../models/User");
const axios = require("axios");
require('dotenv').config();
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { createWallet } = require("./wallet-controller");



// Controller function to select a verification method (Authenticated)
const selectVerificationMethod = async (req, res) => {
  const { verification_method } = req.body;
  const userId = req.user.userId; // Get user ID from authenticated session

  // Valid verification methods
  const validMethods = ["NIN", "Passport", "Driver’s License", "Voter’s Card", "BVN"];

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

const verifyNIN = async (req, res) => {
  try {
    console.log("Request User:", req.user); // Debugging log

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }

    const { nin } = req.query;
    console.log("Received NIN:", nin);

    if (!nin) {
      return res.status(400).json({ message: "NIN is required" });
    }

    // Retrieve user from DB
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    // Call Dojah API to verify NIN
    const response = await axios.get(`${process.env.DOJAH_BASE_URL}/api/v1/kyc/nin`, {
      headers: {
        'AppId': process.env.DOJAH_APP_ID,
        'Authorization': process.env.DOJAH_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      params: { nin }
    });

    if (response.data && response.data.entity) {
      console.log("Dojah Response:", response.data.entity);

      // Update user in the database with NIN verification data
      user.isKYC = true;
      user.verification_method = 'NIN';
      user.verification_data = response.data.entity;

      await user.save();

      res.json({
        success: true,
        message: "NIN verified successfully",
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: "NIN verification failed"
      });
    }
  } catch (error) {
    console.error('Error verifying NIN:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const verifyBVN = async (req, res) => {
  try {
    console.log("Request User:", req.user); // Debugging log

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }

    const { bvn } = req.query;
    console.log("Received BVN:", bvn);

    if (!bvn) {
      return res.status(400).json({ message: "BVN is required" });
    }

    // Retrieve user from DB (instead of only relying on req.user)
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    // Call Dojah API to verify BVN
    const response = await axios.get(`${process.env.DOJAH_BASE_URL}/api/v1/kyc/bvn/advance`, {
      headers: {
        'AppId': process.env.DOJAH_APP_ID,
        'Authorization': process.env.DOJAH_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      params: { bvn }
    });

    if (response.data && response.data.entity) {
      console.log("Dojah Response:", response.data.entity);

      // Update user in the database with BVN verification data
      user.bvn = bvn;
      user.isKYC = true;
      user.verification_method = 'BVN';
      user.verification_data = response.data.entity;

      await user.save();

      res.json({
        success: true,
        message: "BVN verified successfully",
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: "BVN verification failed"
      });
    }
  } catch (error) {
    console.error('Error verifying BVN:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const performLivenessCheck = async (req, res) => {
  try {
    const { input_type, image } = req.body;

    if (!input_type || !image) {
      return res.status(400).json({ message: "Both input_type and image are required." });
    }

    // ✅ Step 1: Download Image from Cloudinary
    const imageResponse = await axios.get(image, { responseType: "arraybuffer" });

    // ✅ Step 2: Convert Image to Base64
    const imageBase64 = Buffer.from(imageResponse.data).toString("base64");

    // ✅ Step 3: Send Base64 Image to Dojah
    const response = await axios.post(
      `${process.env.DOJAH_BASE_URL}/api/v1/ml/liveness/`,
      { input_type, image: imageBase64 },
      {
        headers: {
          "AppId": process.env.DOJAH_APP_ID,
          "Authorization": process.env.DOJAH_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Step 4: Handle Dojah Response
    if (response.data && response.data.entity) {
      return res.json({
        success: true,
        message: "Liveness check successful",
        data: response.data.entity,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Liveness check failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error performing liveness check:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.response?.data || error.message,
    });
  }
};

const removeBase64Metadata = (base64String) => {
  return base64String.replace(/^data:image\/\w+;base64,/, "");
};

const verifySelfieAndID = async (req, res) => {
  try {
    if (!req.files || !req.files.photoid_image || !req.files.selfie_image) {
      return res.status(400).json({ message: "Both ID and selfie images are required" });
    }

    // ✅ Ensure file paths exist
    const photoidFile = req.files.photoid_image[0];
    const selfieFile = req.files.selfie_image[0];

    console.log("Photo ID Path:", photoidFile.path);
    console.log("Selfie Path:", selfieFile.path);

    // ✅ Validate file type (only allow JPEG or PNG)
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (!allowedMimeTypes.includes(photoidFile.mimetype) || !allowedMimeTypes.includes(selfieFile.mimetype)) {
      return res.status(400).json({ success: false, message: "Invalid file type. Only JPEG and PNG are allowed." });
    }

    // ✅ Convert images to Base64
    const photoidBase64 = fs.readFileSync(photoidFile.path, "base64");
    const selfieBase64 = fs.readFileSync(selfieFile.path, "base64");

    // ✅ Remove metadata prefix as required by Dojah API
    const cleanedPhotoidBase64 = removeBase64Metadata(`data:${photoidFile.mimetype};base64,${photoidBase64}`);
    const cleanedSelfieBase64 = removeBase64Metadata(`data:${selfieFile.mimetype};base64,${selfieBase64}`);

    console.log("Photo ID Base64 (trimmed):", cleanedPhotoidBase64.substring(0, 100) + "...");
    console.log("Selfie Base64 (trimmed):", cleanedSelfieBase64.substring(0, 100) + "...");

    // ✅ Prepare API payload
    const payload = {
      photoid_image: cleanedPhotoidBase64,
      selfie_image: cleanedSelfieBase64,
      first_name: req.body.first_name || "Unknown",
      last_name: req.body.last_name || "Unknown",
    };

    console.log("Payload Sent to Dojah:", JSON.stringify(payload, null, 2));

    // ✅ Send request to Dojah API
    const response = await axios.post(
      `${process.env.DOJAH_BASE_URL}/api/v1/kyc/photoid/verify`,
      payload,
      {
        headers: {
          AppId: process.env.DOJAH_APP_ID,
          Authorization: process.env.DOJAH_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Handle API Response
    const { success, data } = response.data;

    if (success && data?.confidence >= 60) {
      return res.json({
        success: true,
        message: "Selfie and ID verification successful",
        confidence: data.confidence,
        data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Verification failed. Please try again with a clearer image.",
        confidence: data?.confidence || 0,
      });
    }
  } catch (error) {
    console.error("Error verifying Selfie & ID:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.response?.data || error.message,
    });
  } finally {
    // ✅ Delete uploaded files after processing
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", file.path, err);
          });
        });
    }
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











module.exports = {
  selectVerificationMethod,
  verifyNIN,
  verifyBVN,
  performLivenessCheck,
  verifySelfieAndID,
  verifyAddress,
};
