const express = require('express');
const {
  getAllUsers,
  persistUser,
  signIn,
  signUp,
  changePassword,
  checkUserExists ,
  forgotPassword,
   resendOtp,
  verifyEmailOtp,
  deleteUserById,
} = require('../controllers/user-controller');

const router = express.Router();

router.post('/all-users', getAllUsers);
router.post('/register', signUp);
router.post('/login', signIn);
router.post('/validate-user', checkUserExists)
router.get('/persist-user', persistUser);
router.post('/forgot-password', forgotPassword);
router.put('/change-password/:id/:token', changePassword);
router.post("/resend-otp", resendOtp);
router.post('/verify-account', verifyEmailOtp);
router.post('/delete-user', deleteUserById);

module.exports = router;
