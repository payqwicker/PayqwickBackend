const express = require('express');
const  prepaidElectrictyRouter  = require('./prepaid-electricty-route');
const  southAfricaAirtime  = require('./airtime-sa-route');
const  southAfricaDataBundle  = require('./dataBundle-sa-route');
const  southAfricaTvCable  = require('./tvCable-sa-route');
const { getWallet, creditWallet } = require('../controllers/sa-wallet-controller');

const router = express.Router();

router.use('/buy-electricity', prepaidElectrictyRouter);
router.use('/buy-airtime', southAfricaAirtime);
router.use('/buy-data', southAfricaDataBundle);
router.use('/buy-tv-cable', southAfricaTvCable);

router.post('/sa-wallet/get', getWallet);
router.put('/sa-wallet/credit', creditWallet);

module.exports = router;
