const express = require("express");
const {
  addExchangeRequest,
  getAllExchangeRequests,
  updateIsCompleted,
} = require("../controllers/airtime-ex-request-controller");

const router = express.Router();

router.post("/send-request", addExchangeRequest);
router.post("/all", getAllExchangeRequests);
router.patch("/:requestId", updateIsCompleted);
module.exports = router;
