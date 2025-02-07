const express = require("express");
const {
  addWalletAddress,
  deleteWalletAddress,
  getAllWalletAddress,
} = require("../controllers/coinaddress-controller");

const router = express.Router();

router.get("/get-coin-addresses", getAllWalletAddress);
router.post("/add-coin-address", addWalletAddress);
router.post("/delete-coin-address/:id", deleteWalletAddress);
module.exports = router;
