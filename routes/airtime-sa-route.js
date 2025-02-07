const express = require('express');
const {
  buyAirtime,
} = require('../controllers/buy-sa-airtime-controller');

const router = express.Router();

router.post('/airtime', buyAirtime);

module.exports = router;