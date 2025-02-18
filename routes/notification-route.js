const express = require('express');
const router = express.Router();
const { getUserNotifications } = require('../controllers/notification-controler');
const authMiddleware = require('../authMiddleware/authMiddleware');


router.get('/:userId', authMiddleware, getUserNotifications);

module.exports = router;
