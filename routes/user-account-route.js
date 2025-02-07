const express = require("express");
const {
  addAccount,
  deleteAccount,
  getUserAccount,
  getAllUserAccounts,
  createPersistentAccount,
  deleteVirtualAccount,
  getAllVirtualAccounts,
} = require("../controllers/user-account-controller");
// const authMiddleWare = require("../authMiddleware/authMiddleware");

const router = express.Router();

router.get("/get-account/:userId", getUserAccount);

router.get("/get-Virtual",getAllVirtualAccounts);
router.post("/virtual-account", createPersistentAccount)

router.get("/get-all-accounts/:userId", getAllUserAccounts);
router.post("/add-account", addAccount);
router.delete("/delete-account/:id", deleteAccount);
router.delete("/deleteVirtualAccount/:userId", deleteVirtualAccount);
module.exports = router;
