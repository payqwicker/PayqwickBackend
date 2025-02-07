const express = require("express");
const {
  addExchange,
  deleteExchange,
  editExchange,
  getAllExchanges,
  getAllMoneyCurrencies,
} = require("../controllers/exchange-controller");
const upload = require("../config/multer");

const router = express.Router();

router.get("/get-exchanges", getAllExchanges);
router.get("/get-currencies", getAllMoneyCurrencies);
router.put("/edit-exchange/:id", editExchange);
router.post("/add-exchange", upload.single("file"), addExchange);
router.post("/delete-exchange/:id", deleteExchange);
module.exports = router;
