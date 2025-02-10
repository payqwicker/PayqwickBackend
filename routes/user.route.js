const express = require('express');
const {
  getAllUsers,
  persistUser,
  signIn,
  signUp,
  changePassword,
  checkUserExists ,
  forgotPassword,
  resendOTP,
  verifyEmailOtp,
  deleteUserById,
  logout,
} = require('../controllers/user-controller');
const authMiddleware = require('../authMiddleware/authMiddleware');

const router = express.Router();

router.post('/all-users', getAllUsers);
router.post('/register', signUp);
router.post('/login', signIn);
router.post('/validate-user', checkUserExists)
router.get('/persist-user', persistUser);
router.post('/forgot-password', forgotPassword);
router.put('/change-password/:id/:token', changePassword);
router.post("/resend-otp", resendOTP);
router.post('/verify-account', verifyEmailOtp);
router.post('/delete-user', deleteUserById);
router.post('/logout', authMiddleware, logout);

module.exports = router;
