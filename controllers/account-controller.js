// controllers/exchangeRateController.js

const User = require("../models/User");
const Account = require("../models/Account");

const getAccounts = async (req, res) => {
  try {
    const allAccount = await Account.find();
    res.json(allAccount);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addAccount = async (req, res) => {
  const { accountName, bankName, accountNumber, userId, currency } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (!currency) {
    return res
      .status(404)
      .json({ message: "Please provide currency", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const newAccount = new Account({
      accountName,
      accountNumber,
      bankName,
      currency,
    });

    await newAccount.save();
    res.json(newAccount);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found", ok: false });
  }
  if (user.userType !== "admin") {
    return res.status(404).json({ message: "Unauthorized User", ok: false });
  }

  try {
    const deletedAccount = await Account.findByIdAndRemove(id);

    if (!deletedAccount) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addAccount,
  deleteAccount,
  getAccounts,
};
