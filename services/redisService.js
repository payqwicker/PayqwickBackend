const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL);

// Store session (refresh token) in Redis
const storeSession = async (userId, token) => {
  await redisClient.set(`session:${userId}`, token, "EX", 7 * 24 * 60 * 60); // Expires in 7 days
};

// Retrieve session (check if refresh token exists)
const getSession = async (userId) => {
  return await redisClient.get(`session:${userId}`);
};

// Delete session (invalidate token on logout)
const deleteSession = async (userId) => {
  await redisClient.del(`session:${userId}`);
};

module.exports = { storeSession, getSession, deleteSession };
