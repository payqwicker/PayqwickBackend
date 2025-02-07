const express = require("express");
const {
  addExchangeSetting,
  deleteExchangeRate,
  editExchangeData,
  getExchangeData,
} = require("../controllers/airtime-exchange-controller");

const router = express.Router();

router.get("/get-exchange-data", getExchangeData);
router.put("/edit-exchange/:id", editExchangeData);
router.post("/add-exchange", addExchangeSetting);
router.delete("/delete-exchange/:id", deleteExchangeRate);
module.exports = router;
