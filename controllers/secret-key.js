// controllers/exchangeRateController.js

const SecretKey = require('../models/SecretKey');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const getKey = async (req, res) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided', ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(' ')[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token provided', ok: false });
  }

  const decoded = jwt.verify(token, process.env.SECRET_KEY);

  // Extract the user ID from the decoded token
  const userId = decoded.userId;

  // Retrieve the user from the database based on the user ID
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'Unauthorized token', ok: false });
  }
  try {
    const secretKey = await SecretKey.find();
    res.json(secretKey[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const addKey = async (req, res) => {
  const { paystackKey } = req.body;
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided', ok: false });
  }

  // Extract the token from the "Authorization" header
  const token = authHeader.split(' ')[1]; // Assuming the header format is "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token provided', ok: false });
  }

  const decoded = jwt.verify(token, process.env.SECRET_KEY);

  // Extract the user ID from the decoded token
  const userId = decoded.userId;

  // Retrieve the user from the database based on the user ID
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'Unauthorized token', ok: false });
  }
  try {
    const newKey = new SecretKey({
      paystackKey,
    });
    await newKey.save();
    res.json(newKey);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  addKey,
  getKey,
};
