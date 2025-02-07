const express = require('express');
const {
  getAllUsers,
  persistUser,
  signIn,
  signUp,
  changePassword,
  forgotPassword,
  verifyEmailOtp,
  deleteUserById,
} = require('../controllers/user-controller');

const router = express.Router();

router.post('/all-users', getAllUsers);
router.post('/register', signUp);
router.post('/login', signIn);
router.get('/persist-user', persistUser);
router.post('/forgot-password', forgotPassword);
router.put('/change-password', changePassword);
router.post('/verify-account', verifyEmailOtp);
router.post('/delete-user', deleteUserById);

module.exports = router;
