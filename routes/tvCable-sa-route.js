const express = require('express');
const {
  buyTvCable,
} = require('../controllers/buy-sa-tvCable-controller');

const router = express.Router();

router.post('/tvCable', buyTvCable);

module.exports = router;