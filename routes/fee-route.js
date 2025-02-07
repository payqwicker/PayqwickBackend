const express = require("express");
const {
  addFee,
  deleteFee,
  editFee,
  getAllFees,
} = require("../controllers/fee-controller");

const router = express.Router();

router.get("/get-fees", getAllFees);
router.put("/edit-fee/:id", editFee);
router.post("/add-fee", addFee);
router.post("/delete-fee/:id", deleteFee);
module.exports = router;
