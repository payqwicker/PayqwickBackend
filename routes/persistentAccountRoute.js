const express = require("express");
const { createWallet } = require("../controllers/wallet-controller");
const router = express.Router();


router.post("/", createWallet)


module.exports = router;
