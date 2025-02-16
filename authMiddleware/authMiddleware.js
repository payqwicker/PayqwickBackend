

const jwt = require("jsonwebtoken");
const HttpError = require("../models/errorModel");
const { updateLastActive, isSessionExpired, deleteSession } = require("../services/redisService");

const authMiddleware = async (req, res, next) => {
  const Authorization = req.headers["authorization"] || req.headers["Authorization"];

  if (!Authorization || !Authorization.startsWith("Bearer ")) {
    return next(new HttpError("Unauthorized, No token", 403));
  }

  const token = Authorization.split(" ")[1]; // Extract token

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Check if the user session is expired (inactive for 15+ mins)
    const expired = await isSessionExpired(decoded.userId);
    if (expired) {
      await deleteSession(decoded.userId);
      return next(new HttpError("Session expired due to inactivity, please log in again", 403));
    }

    // If session is active, update last active time
    await updateLastActive(decoded.userId);

    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return next(new HttpError("Unauthorized, Invalid token", 403));
  }
};

module.exports = authMiddleware;

