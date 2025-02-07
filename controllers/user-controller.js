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

const signUp = async (req, res) => {
  // Validate the request data using express-validator
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), ok: false });
  }

  let { email, full_name, phone, country, password } = req.body;

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must not be less than 8 characters",
      ok: false,
    });
  }

  try {
    // Check if the user already exists with the given email
    const existingUser = await User.findOne({ email });
    const checkPhone = await User.findOne({ phone });
    if (existingUser || checkPhone) {
      return res
        .status(400)
        .json({
          message: "User with this email or Phone already exists!",
          ok: false,
        });
    }
    // const fullName = firstName + lastName;
    // Create a new user
    const otp = generateRandomUniqueOTP(6);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      // firstName,
      // lastName,
      fullName: full_name,
      country,
      phone,
      password: hashedPassword,
      emailVerificationOTP: otp, // Store the OTP
      emailVerificationOTPExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in milliseconds
    });
    // Generate a JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "1day",
      }
    );

    await newUser.save();
    const newWallet = new Wallet({
      user: newUser._id, // Reference the user's ID
    });
    const newSaWallet = new SWallet({
      user: newUser._id, // Reference the user's
    });
    await newWallet.save();
    await newSaWallet.save();
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.AUTH_EMAIL, // Your Gmail email address
        pass: process.env.AUTH_PASS, // Use an App Password generated from your Gmail account settings (more secure)
      },
    });

    const message = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP for email verification is: ${otp}`,
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        res.status(500).json({ err });
      }
      if (info) {
        res.status(201).json({ message: "You should receive an email" });
      }
    });

    return res.status(201).json({
      message: "User created successfully",
      token,
      ok: true,
      user: {
        email: newUser.email,
        fullName: newUser.fullName,
        id: newUser._id,
        isVerified: newUser.isVerified,
        phone: newUser.phone,
        userType: newUser.userType,
      },
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    return res.status(500).json({ message: "Internal server error" });
  }
};

const signIn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), ok: false });
  }

  let { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "User does not exist", ok: false });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ message: "Incorrect email or password", ok: false });
    }

    // Check if the account is verified
    if (!user.isVerified) {
      const otp = generateRandomUniqueOTP(6);
      user.emailVerificationOTP = otp;
      user.emailVerificationOTPExpires = Date.now() + 5 * 60 * 1000; // 5 minutes in milliseconds
      // console.log(user)
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
        subject: "Email Verification OTP",
        text: `Your OTP for email verification is: ${otp}`,
      };

       try {
       const info =   await transporter.sendMail(mailOptions);
      //  console.log("Email", info)
         return res.status(401).json({
           message:
             "Account is not verified. A new OTP has been sent to your email.",
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

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "1day",
      }
    );

    // Additional logic for admin users
    if (user.userType === "admin") {
      const currentDate = new Date();
      const firstDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const totalUsers = await User.countDocuments();
      const totalTransactions = await Transaction.countDocuments();
    //  const transactionHistories = await TransactionHistory.countDocuments();//adding history if needed
     
      const totalTransactionsThisMonth = await Transaction.countDocuments({
        dateUTC: {
          $gte: firstDayOfCurrentMonth,
          $lte: lastDayOfCurrentMonth,
        },
      });
      // const totalTransactionHistoryThisMonth = await TransactionHistory.countDocuments({
      //   dateUTC: {
      //     $gte : firstDayOfCurrentMonth,
      //     $lte: lastDayOfCurrentMonth
      //   },
      // }
      // )
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

    // Return the response for non-admin users
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
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
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
    if (
      user.emailVerificationOTP === otp &&
      user.emailVerificationOTPExpires > new Date()
    ) {
      // OTP is valid and within the expiration time
      // Mark the email as verified
      user.isVerified = true;
      // user.isKYC = true;
      user.emailVerificationOTP = null; // Clear the OTP
      user.emailVerificationOTPExpires = null; // Clear the OTP expiration time

      await user.save();

      return res
        .status(200)
        .json({ message: "Email verified successfully", ok: true });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid or expired OTP", ok: false });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      ok: false,
    });
  }
};

// forgot password.

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

// const changePassword = async (req, res) => {
//   // const { email, otp, newPassword } = req.body;
//    const {id, token} = req.params;
//   try {
//     // Find the user by email
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found", ok: false });
//     }

//     if (
//       user.passwordResetOtp === otp &&
//       user.passwordResetOtpExpires > new Date()
//     ) {
//       user.password = await bcrypt.hash(newPassword, 10); // Hash the new password
//       user.passwordResetOtp = null;
//       user.passwordResetOtpExpires = null;
//       await user.save();

//       return res
//         .status(200)
//         .json({ message: "Password reset successfully", ok: true });
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired OTP", ok: false });
//     }
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", ok: false });
//   }
// };

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


const resendOtp = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), ok: false });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Account does not exist", ok: false });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "User is already verified", ok: false });
    }

    // Ensure OTP has expired before generating a new one
    const currentTime = Date.now();
    if (user.emailVerificationOTPExpires > currentTime) {
      return res.status(400).json({
        message: "Please wait before requesting a new OTP",
        ok: false,
      });
    }

    // Generate a new OTP and set expiration (5 minutes)
    const otp = generateRandomUniqueOTP(6);
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = currentTime + 5 * 60 * 1000;
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
      text: `Your verification OTP is: ${otp}. It expires in 5 minutes.`,
    };

    transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ message: "OTP sent to your email", ok: true });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", ok: false });
  }
};

module.exports = {
  getAllUsers,
  signIn,
  signUp,
  verifyEmailOtp,
  resendOtp,
  changePassword,
  forgotPassword,
  checkUserExists,
  persistUser,
  deleteUserById,
};
