const Redis = require("ioredis");
const useragent = require('useragent'); // For parsing the User-Agent string
const redisClient = new Redis(process.env.REDIS_URL);

// Log a message when Redis is connected
redisClient.on("connect", () => {
  console.log("Successfully connected to Redis");
});

// Store session with both refresh token and activity tracking

const storeSession = async (req, userId, accessToken, refreshToken, deviceId) => {
  const timestamp = Date.now(); // Store the current timestamp

  // Extract user's IP address from the request (can be different if behind a proxy)
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Extract device name and sign-in method from the User-Agent string
  const userAgent = req.get('User-Agent');
  const agent = useragent.parse(userAgent);

  // Fallback to more useful values if deviceName or signInVia is not extracted properly
  const deviceName = agent.device && agent.device.toString() !== 'Other' ? agent.device.toString() : 'Unknown Device';
  const signInVia = agent.family && agent.family !== 'Other' ? agent.family : 'Unknown Browser';

  // Format the timestamp to human-readable date
  const formattedTimestamp = new Date(timestamp).toLocaleString(); // Customize as needed

  // Store access token (expires in 15 minutes)
  await redisClient.set(`access:${userId}:${deviceId}`, accessToken, "EX", 15 * 60);

  // Store refresh token (expires in 7 days)
  await redisClient.set(`refresh:${userId}:${deviceId}`, refreshToken, "EX", 7 * 24 * 60 * 60);

  // Store last active time (Unix timestamp, expires in 15 minutes)
  await redisClient.set(`lastActive:${userId}:${deviceId}`, timestamp.toString(), "EX", 15 * 60);

  // Store device metadata as JSON string (device name, location (IP), sign-in method, and timestamp)
  const deviceMetadata = JSON.stringify({
    deviceId,
    deviceName,
    ipAddress,       // Store IP address as location
    signInVia,       // Sign-in method, e.g., "Google Chrome"
    timestamp: formattedTimestamp,  // Formatted session creation timestamp
  });

  // Store metadata for the device
  await redisClient.set(`device:${userId}:${deviceId}`, deviceMetadata, "EX", 7 * 24 * 60 * 60); // Expire in 7 days
};


// Retrieve access token
const getAccessToken = async (userId, deviceId) => {
  return await redisClient.get(`access:${userId}:${deviceId}`);
};

// Retrieve refresh token
const getRefreshToken = async (userId, deviceId) => {
  return await redisClient.get(`refresh:${userId}:${deviceId}`);
};

// Update last active time (called on every request)
const updateLastActive = async (userId, deviceId) => {
  await redisClient.set(`lastActive:${userId}:${deviceId}`, Date.now().toString(), "EX", 15 * 60);
};

// Check if session is inactive for over 15 minutes
const isSessionExpired = async (userId, deviceId) => {
  const lastActive = await redisClient.get(`lastActive:${userId}:${deviceId}`);
  if (!lastActive) return true; // No last active timestamp means expired

  const currentTime = Date.now();
  const lastActiveTime = parseInt(lastActive, 10);

  // If inactive for over 15 minutes, return true
  return currentTime - lastActiveTime > 15 * 60 * 1000;
};

// Delete session (invalidate both access & refresh tokens)
const deleteSession = async (userId, deviceId) => {
  try {
    // Delete all related keys for the user and device in parallel
    await Promise.all([
      redisClient.del(`access:${userId}:${deviceId}`),
      redisClient.del(`refresh:${userId}:${deviceId}`),
      redisClient.del(`lastActive:${userId}:${deviceId}`),
      redisClient.del(`device:${userId}:${deviceId}`)
    ]);
    console.log(`Session for user ${userId} and device ${deviceId} has been deleted.`);
  } catch (error) {
    console.error(`Failed to delete session for user ${userId} and device ${deviceId}:`, error);
    throw error; // Rethrow the error to be caught in the handler
  }
};


// Fetch active sessions/devices for the user
const fetchActiveSessions = async (userId) => {
  // Get all keys related to access tokens for the given user (e.g., "access:12345:*")
  const keys = await redisClient.keys(`access:${userId}:*`);
  
  if (keys.length === 0) {
    return []; // No active sessions found
  }

  // Fetch all access tokens, last active times, and device metadata in parallel
  const accessTokens = await redisClient.mget(...keys);  // Get all access tokens at once
  const lastActiveKeys = keys.map(key => key.replace('access:', 'lastActive:'));
  const lastActiveTimes = await redisClient.mget(...lastActiveKeys);  // Get all last active times at once

  const deviceMetadataKeys = keys.map(key => key.replace('access:', 'device:'));
  const deviceMetadata = await redisClient.mget(...deviceMetadataKeys);  // Get all device metadata at once

  const activeSessions = [];

  keys.forEach((key, index) => {
    const deviceId = key.split(':').pop();  // Extract deviceId from the key
    const accessToken = accessTokens[index];
    const lastActive = lastActiveTimes[index];
    const metadata = deviceMetadata[index];

    // If access token, last active time, and metadata are available, construct the active session
    if (accessToken && lastActive && metadata) {
      // Parse metadata to extract device info
      const deviceInfo = JSON.parse(metadata);
      activeSessions.push({
        deviceId,
        accessToken,
        lastActive: parseInt(lastActive, 10),  // Convert last active to number
        deviceInfo: {
          deviceName: deviceInfo.deviceName || 'Unknown',
          location: deviceInfo.ipAddress || 'Unknown',
          signInVia: deviceInfo.signInVia || 'Unknown',
          timestamp: deviceInfo.timestamp,  // Store session creation timestamp
        }
      });
    }
  });

  return activeSessions;
};




// Revoke a specific session/device
const revokeSession = async (userId, deviceId) => {
  console.log(`Revoking session for user: ${userId}, device: ${deviceId}`);
  await deleteSession(userId, deviceId);
};
module.exports = {
  storeSession,
  getAccessToken,
  getRefreshToken,
  updateLastActive,
  isSessionExpired,
  deleteSession,
  fetchActiveSessions,
  revokeSession,
};
