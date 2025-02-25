const Redis = require("ioredis");
const redisClient = new Redis(process.env.REDIS_URL);

// Log a message when Redis is connected
redisClient.on("connect", () => {
  console.log("Successfully connected to Redis");
});

// Store session with both refresh token and activity tracking
const storeSession = async (userId, accessToken, refreshToken) => {
  // Store access token (expires in 15 minutes)
  await redisClient.set(`access:${userId}`, accessToken, "EX", 15 * 60);

  // Store refresh token (expires in 7 days)
  await redisClient.set(`refresh:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);

  // Store last active time (Unix timestamp)
  await redisClient.set(`lastActive:${userId}`, Date.now().toString(), "EX", 15 * 60);
};

// Retrieve access token
const getAccessToken = async (userId) => {
  return await redisClient.get(`access:${userId}`);
};

// Retrieve refresh token
const getRefreshToken = async (userId) => {
  return await redisClient.get(`refresh:${userId}`);
};

// Update last active time (called on every request)
const updateLastActive = async (userId) => {
  await redisClient.set(`lastActive:${userId}`, Date.now().toString(), "EX", 15 * 60);
};

// Check if session is inactive for over 15 minutes
const isSessionExpired = async (userId) => {
  const lastActive = await redisClient.get(`lastActive:${userId}`);
  if (!lastActive) return true; // No last active timestamp means expired

  const currentTime = Date.now();
  const lastActiveTime = parseInt(lastActive, 10);

  // If inactive for over 15 minutes, return true
  return currentTime - lastActiveTime > 15 * 60 * 1000;
};

// Delete session (invalidate both access & refresh tokens)
const deleteSession = async (userId) => {
  await redisClient.del(`access:${userId}`);
  await redisClient.del(`refresh:${userId}`);
  await redisClient.del(`lastActive:${userId}`);
};

module.exports = {
  storeSession,
  getAccessToken,
  getRefreshToken,
  updateLastActive,
  isSessionExpired,
  deleteSession,
};
