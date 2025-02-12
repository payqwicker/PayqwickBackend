require("dotenv").config();
const User = require("../models/User");


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


// Controller function to verify a NIN (Authenticated)
const verifyNIN = async (req, res) => {
  try {
    const { nin } = req.body;
    if (!nin) {
      return res.status(400).json({ error: "NIN is required" });
    }

    const response = await fetch("https://api.dojah.io/api/v1/kyc/nin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AppId": process.env.DOJAH_APP_ID,
        "Authorization": `Bearer ${process.env.DOJAH_SECRET_KEY}`,
      },
      body: JSON.stringify({ id: nin }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Verification failed",
        details: data,
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Verification failed",
      details: error.message,
    });
  }
};

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


module.exports = {
  selectVerificationMethod,
  verifyNIN,
  faceMatch
};
