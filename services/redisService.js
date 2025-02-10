const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL || "redis://default:dT03Dm64w4zGh5Mb7niFiz1kklZfeYQC@redis-12900.c99.us-east-1-4.ec2.redns.redis-cloud.com:12900");

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
