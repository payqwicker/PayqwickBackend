// const jwt = require("jsonwebtoken");
// const HttpError = require("../models/errorModel");
// const { getSession } = require("../services/redisService");

// const authMiddleware = async (req, res, next) => {
//   // Get Authorization header
//   const Authorization = req.headers['Authorization'] || req.headers['authorization'];

//   if (Authorization && Authorization.startsWith("Bearer")) {
//     const token = Authorization.split(" ")[1]; // Extract the token
//     console.log('Received Token:', token); // Log token received in request

//     // Verify the access token
//     jwt.verify(token, process.env.SECRET_KEY, async (err, info) => {
//       if (err) {
//         console.error('JWT Error:', err); // Log error details
//         return next(new HttpError("Unauthorized, Invalid token", 403));
//       }

//       console.log('Decoded JWT Info:', info); // Log the decoded JWT information

//       // Check if the refresh token exists in Redis (session management)
//       const storedRefreshToken = await getSession(info.userId); // Get stored refresh token from Redis
//       console.log('Stored Refresh Token in Redis:', storedRefreshToken); // Log the stored refresh token

//       if (!storedRefreshToken) {
//         console.log('No refresh token found in Redis'); // Log if no refresh token found
//         return next(new HttpError("Session expired, please log in again", 403));
//       }

//       // If the access token is valid, and the refresh token exists in Redis, proceed
//       req.user = info; // Attach decoded user info to request
//       next();
//     });
//   } else {
//     console.log('No token found'); // Log if no token is found in the request
//     return next(new HttpError("Unauthorized, No token", 403));
//   }
// };

// module.exports = authMiddleware;



// const jwt = require("jsonwebtoken");
// const HttpError = require("../models/errorModel");
// const { getSession } = require("../services/redisService");

// const authMiddleware = async (req, res, next) => {
//   try {
//     // Get Authorization header (always lowercase in Express)
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       console.log("No token found");
//       return next(new HttpError("Unauthorized, No token", 403));
//     }

//     const token = authHeader.split(" ")[1]; // Extract token
//     console.log("Received Token:", token);

//     // Verify the JWT access token
//     const decoded = jwt.verify(token, process.env.SECRET_KEY);
//     console.log("Decoded JWT Info:", decoded);

//     // Check if session exists in Redis (instead of checking refresh token)
//     const sessionExists = await getSession(decoded.userId);
//     if (!sessionExists) {
//       console.log("Session expired or invalid");
//       return next(new HttpError("Session expired, please log in again", 403));
//     }

//     // Attach user info to request object
//     req.user = decoded;
//     next();
//   } catch (error) {
//     console.error("JWT Verification Error:", error);
//     return next(new HttpError("Unauthorized, Invalid token", 403));
//   }
// };

// module.exports = authMiddleware;

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

