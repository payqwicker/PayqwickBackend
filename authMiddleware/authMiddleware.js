const jwt = require("jsonwebtoken");
const HttpError = require("../models/errorModel");
const { getSession } = require("../services/redisService"); // Import Redis session function

const authMiddleware = async (req, res, next) => {
  const Authorization = req.headers.Authorization || req.headers.authorization;

  if (Authorization && Authorization.startsWith("Bearer")) {
    const token = Authorization.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, info) => {
      if (err) {
        return next(new HttpError("Unauthorized, Invalid token", 403));
      }

      // Check if token exists in Redis (session management)
      const storedToken = await getSession(info.userId);
      if (!storedToken || storedToken !== token) {
        return next(new HttpError("Session expired, please log in again", 403));
      }

      req.user = info;
      next();
    });
  } else {
    return next(new HttpError("Unauthorized, No token", 403));
  }
};

module.exports = authMiddleware;
