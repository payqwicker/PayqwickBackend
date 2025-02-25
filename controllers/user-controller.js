const { validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Wallet = require("../models/Wallet");
const jwt = require("jsonwebtoken");
const { generateRandomUniqueOTP } = require("../utils/functions");
const Transaction = require("../models/Transaction");
const TransactionHistory = require("../models/TransactionHistory");
const SWallet = require("../models/sa-Wallet");
const validator = require("validator");
const disposableDomains = require('disposable-email-domains');
const wildcardDomains = require('disposable-email-domains/wildcard');
const { deleteSession, storeSession } = require("../services/redisService");
require('dotenv').config();



const rateLimit = {};

const isDisposableEmail = (email) => {
  const domain = email.split('@')[1].toLowerCase();
  
  // Add common disposable domains
  const additionalDisposableDomains = [
    'tempmail.com',
    'temp-mail.org',
    'tempmailaddress.com',
    'tmpmail.org',
    'tmpmail.net',
    'temp-mail.io',
    'fake-mail.net',
    'throwawaymail.com',
    'trashmail.com',
    'junkmail.com',
    'spamtrap.org',
    'mailinator.com',
    'trash-mail.at',
    'tempinbox.co.uk',
    'tempmail.us',
    'temp.emerald.com',
    'tempinbox.com',
    'tempmail.co.za',
    'tempinbox.eu',
    'tempmail.io',
    'tempmail.ws',
    'tempmail.cf',
    'tempmail.ga',
    'tempmail.gq',
    'tempmail.tk',
    'tempmail.ws',
    'tempmail.cf',
    'tempmail.ga',
    'tempmail.gq',
  ];
  
  return disposableDomains.includes(domain) || 
         wildcardDomains.some(wildcard => domain.endsWith(wildcard)) ||
         additionalDisposableDomains.includes(domain);
};


const signUp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), ok: false });
  }

  // Destructure required fields, including payqwickerTag
  let { email, full_name, phone, country, password, payqwickerTag } = req.body;

  // Ensure payqwickerTag is provided since it's required now
  if (!payqwickerTag) {
    return res.status(400).json({ message: "Payqwicker Tag is required.", ok: false });
  }

  // Ensure the tag always has an '@' at the beginning
  if (!payqwickerTag.startsWith('@')) {
    payqwickerTag = '@' + payqwickerTag;
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format.", ok: false });
  }

  if (isDisposableEmail(email)) {
    return res.status(400).json({ message: "Disposable emails are not allowed.", ok: false });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters.", ok: false });
  }

  try {
    const existingUser = await User.findOne({ email });
    const checkPhone = await User.findOne({ phone });

    if (existingUser || checkPhone) {
      return res.status(400).json({ message: "User already exists!", ok: false });
    }

    const otp = generateRandomUniqueOTP(6);
    const hashedOtp = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      fullName: full_name,
      country,
      phone,
      password: hashedPassword,
      emailVerificationOTP: hashedOtp,
      emailVerificationOTPExpires: new Date(Date.now() + 5 * 60 * 1000),
      payqwickerTag, // Tag now guaranteed to start with '@'
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Send OTP via email.
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.AUTH_EMAIL, pass: process.env.AUTH_PASS },
    });

    const message = {
      from: process.env.AUTH_SENDER,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        return res.status(500).json({ message: "Failed to send OTP email", ok: false });
      }
    });

    return res.status(201).json({
      message: "User created successfully. OTP sent.",
      token,
      ok: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};

const getAllUsers = async (req, res, next) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }
  try {
    const users = await User.find();
    if (!users.length) {
      return res.status(404).json({ message: "No user found", ok: false });
    } else {
      return res.status(200).json({
        users: users.map((user) => ({
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          createdAt: user.createdAt,
        })),
        ok: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

 const checkUserExists = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), ok: false });
  }
  const { email, phone } = req.body;

  // Validate request body
  if (!email && !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email or password to check.",
    });
  }

  try {
    // Query the database for a user with the given email or password
    const user = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (user) {
      return res.status(200).json({
        success: true,
        message: "User already exists.",
        data: {
          email: user.email,
          phone: user.phone
        },
      });
    }

    // If no user is found
    return res.json({
      success: false,
      message: "No user found with the provided email or password.",
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking the user.",
    });
  }
};

const deleteUserById = async (req, res, next) => {
  //const { userId, adminId } = req.body;
  const { userId} = req.body;

  try {
    const requestingUser = await User.findById(adminId);
    if (!requestingUser || requestingUser.userType !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized access", ok: false });
    }
    
    // Find the user to be deleted
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found", ok: false });
    }

    await userToDelete.deleteOne();

    return res
      .status(200)
      .json({ message: "User deleted successfully", ok: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", ok: false });
  }
};

const signIn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), ok: false });
  }

  // Destructure identifier and password from req.body
  let { identifier, password } = req.body;

  // Validate that both identifier and password are provided
  if (!identifier || typeof identifier !== "string") {
    return res.status(400).json({ message: "Identifier is required", ok: false });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ message: "Password is required", ok: false });
  }

  try {
    let user;
    // If identifier is an email, search by email; otherwise, treat it as a username (payqwickerTag)
    if (validator.isEmail(identifier)) {
      user = await User.findOne({ email: identifier });
    } else {
      // Ensure the username starts with '@' since that's how it's stored
      if (!identifier.startsWith('@')) {
        identifier = '@' + identifier;
      }
      user = await User.findOne({ payqwickerTag: identifier });
    }

    if (!user) {
      return res.status(401).json({ message: "User does not exist", ok: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        return res.status(403).json({ message: "Too many failed attempts. Try again later.", ok: false });
      }

      await user.save();
      return res.status(401).json({ message: "Incorrect email or password", ok: false });
    }

    if (!user.isVerified) {
      const otp = generateRandomUniqueOTP(6);
      const hashedOtp = await bcrypt.hash(otp, 10);
      user.emailVerificationOTP = hashedOtp;
      user.emailVerificationOTPExpires = Date.now() + 5 * 60 * 1000;
      await user.save();

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.AUTH_EMAIL,
          pass: process.env.AUTH_PASS,
        },
      });

      const mailOptions = {
        from: process.env.AUTH_SENDER,
        to: user.email,
        subject: "Email Verification OTP",
        text: `Your OTP for email verification is: ${otp}`,
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(401).json({
          message: "Account is not verified. A new OTP has been sent to your email.",
          ok: false,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res.status(500).json({
          message: "Error sending verification email. Please try again later.",
          ok: false,
        });
      }
    }

    user.lastActive = Date.now();
    user.failedLoginAttempts = 0; // Reset failed attempts
    await user.save();

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await storeSession(user._id.toString(), accessToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Signin successful",
      accessToken: `Bearer ${accessToken}`,
      ok: true,
      user: {
        email: user.email,
        fullName: user.fullName,
        id: user._id,
        isVerified: user.isVerified,
        phone: user.phone,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};

const persistUser = async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(" ")[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided", ok: false });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Extract the user ID from the decoded token
    const userId = decoded.userId;

    // Retrieve the user from the database based on the user ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found", ok: false });
    }

    // Additional logic for admin users
    if (user.userType === "admin") {
      const totalUsers = await User.countDocuments();
      const totalTransactions = await Transaction.countDocuments();
      const totalTransactionsThisMonth = await Transaction.countDocuments({
        dateUTC: { $gte: new Date().setMonth(new Date().getMonth() - 1) },
      });
      const totalWallets = await Wallet.countDocuments();
      const totalNewUsersThisWeek = await User.countDocuments({
        createdAt: { $gte: new Date().setDate(new Date().getDate() - 7) },
      });
      const totalSuccessfulBillPayTransactions =
        await Transaction.countDocuments({
          status: "SUCCESSFUL",
          transactionType: "BILL_PAY",
        });
      const totalSuccessfulAirtimeDataTransactions =
        await Transaction.countDocuments({
          status: "SUCCESSFUL",
          transactionType: "SELL_AIRTIME_PRE_PAID",
        });

      return res.status(200).json({
        message: "Signin successful",
        token,
        ok: true,
        user: {
          email: user.email,
          fullName: user.fullName,
          id: user._id,
          isVerified: user.isVerified,
          phone: user.phone,
          userType: user.userType,
          stats: {
            totalUsers,
            totalTransactions,
            totalTransactionsThisMonth,
            totalWallets,
            totalNewUsersThisWeek,
            totalSuccessfulBillPayTransactions,
            totalSuccessfulAirtimeDataTransactions,
          },
        },
      });
    }
    // Return the user object
    return res.status(200).json({
      ok: true,
      user: {
        email: user.email,
        fullName: user.fullName,
        id: user._id,
        isVerified: user.isVerified,
        phone: user.phone,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token is invalid", ok: false });
  }
};

const verifyEmailOtp = async (req, res) => {


  const { email, otp } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found", ok: false });
    }

    // Check if OTP exists and has an expiration time
    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      return res.status(400).json({ message: "OTP not generated or expired", ok: false });
    }

    // Check if OTP has expired
    const currentTime = new Date();
    if (user.emailVerificationOTPExpires < currentTime) {
      return res.status(400).json({ message: "OTP has expired", ok: false });
    }

    // Compare the provided OTP with the hashed OTP stored in the database
    const isOtpValid = await bcrypt.compare(otp, user.emailVerificationOTP);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP", ok: false });
    }

    // OTP is valid and within the expiration time, proceed with email verification
    user.isVerified = true; // Mark the email as verified
    user.emailVerificationOTP = null; // Invalidate OTP (single-use)
    user.emailVerificationOTPExpires = null; // Clear the expiration time

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      ok: true,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      message: "Internal server error",
      ok: false,
    });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;
  
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format.", ok: false });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", ok: false });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified", ok: false });
    }

    const now = Date.now();
    
    // Ensure rateLimit tracking exists
    if (!rateLimit[email]) {
      rateLimit[email] = { attempts: [], lastRequest: 0 };
    }

    // Enforce cooldown period of 1 minute (60,000ms)
    // const lastRequestTime = rateLimit[email].lastRequest;
    // if (now - lastRequestTime < 60 * 1000) {
    //   return res.status(429).json({ message: "Please wait 1 minute before requesting a new OTP.", ok: false });
    // }

    // Enforce hourly request limit (max 3 requests per hour)
    rateLimit[email].attempts = rateLimit[email].attempts.filter((t) => now - t < 60 * 60 * 1000);
    if (rateLimit[email].attempts.length >= 3) {
      return res.status(429).json({ message: "Too many OTP requests. Try again later.", ok: false });
    }

    const newOTP = generateRandomUniqueOTP(6);
    user.emailVerificationOTP = await bcrypt.hash(newOTP, 10); // Hash OTP for security
    user.emailVerificationOTPExpires = new Date(now + 5 * 60 * 1000); // OTP expires in 5 minutes
    await user.save();

    rateLimit[email].attempts.push(now);
    rateLimit[email].lastRequest = now; // Update last request time

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.AUTH_EMAIL, pass: process.env.AUTH_PASS },
    });

    const message = {
      from: process.env.AUTH_SENDER,
      to: email,
      subject: "New OTP",
      text: `Your new OTP is: ${newOTP}`,
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        return res.status(500).json({ message: "Failed to send OTP email", ok: false });
      }
    });

    return res.status(200).json({ message: "New OTP sent successfully", ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), ok: false });
  }

  const { email } = req.body;
  // const otp = generateRandomUniqueOTP(6);

  try {
    // Check if the user with the provided email exists
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Account does not exist", ok: false });
    }
    const secret = process.env.SECRET_KEY + user.password;

    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: Date.now() + 5 * 60 * 1000,
    });
    const link = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;
    console.log(link)
    user.passwordResetOtp = token;
    user.passwordResetOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes in milliseconds
    await user.save();

    // transport the email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.AUTH_EMAIL, // Your Gmail email address
        pass: process.env.AUTH_PASS, // Use an App Password generated from your Gmail account settings (more secure)
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Click the link to reset your password",
      text: `${link}`,
    };

    transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ message: "Reset Link sent to your email", ok: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", ok: false });
  }
};

const changePassword = async (req, res) => {
  const {  newPassword } = req.body;
  const { id, token } = req.params;
  try {
    // Find the user by email
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({ message: "User with that Id not found", ok: false });
    }

       const secret = process.env.SECRET_KEY + user.password;
       try{
        const verify = jwt.verify(token, secret);
        console.log(verify)
         if (verify &&   user.passwordResetOtp === token &&
      user.passwordResetOtpExpires > new Date()){
         user.password = await bcrypt.hash(newPassword, 10); // Hash the new password 
        user.passwordResetOtp = null;
   user.passwordResetOtpExpires = null;
     await user.save();

     return res
       .status(200)
      .json({ message: "Password reset successfully", ok: true });
      }
       } 
       catch(error){
         return res
              .status(400)
             .json({ message: "Invalid or expired JWT secret", ok: false });
       }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", ok: false });
  }
};

const logout = async (req, res) => {
  try {
    await deleteSession(req.user.userId);
    return res.status(200).json({ message: "Logout successful", ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};


module.exports = {
  getAllUsers,
  signIn,
  signUp,
  verifyEmailOtp,
  changePassword,
  forgotPassword,
  checkUserExists,
  persistUser,
  deleteUserById,
  resendOTP,
  logout
};
