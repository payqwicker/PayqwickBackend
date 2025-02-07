const express = require("express");
const {
  addExRequest,
  getAllExRequest,
  updateIsCompleted,
} = require("../controllers/ex-request-controller");

const router = express.Router();

router.post("/send-request", addExRequest);
router.post("/all-request", getAllExRequest);
router.patch("/:requestId", updateIsCompleted);
module.exports = router;
