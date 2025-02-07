const express = require("express");
const {
  addAccount,
  deleteAccount,
  getAccounts,
} = require("../controllers/account-controller");


const router = express.Router();

router.get("/get-accounts", getAccounts);
router.post("/add-account", addAccount);
// router.post("/virtual-account", createPersistentAccount)
router.post("/delete-account/:id", deleteAccount);
module.exports = router;
