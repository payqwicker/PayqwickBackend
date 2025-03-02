const express = require('express');
const { getActiveSessions } = require('../controllers/session-controller');
const { deleteSession } = require('../services/redisService');
const authMiddleware = require('../authMiddleware/authMiddleware');
const router = express.Router();



// Route to get active sessions for a user
router.get('/:userId', getActiveSessions);

// Route to revoke a specific session/device for the user
router.delete('/:userId/:deviceId', deleteSession);

module.exports = router;
