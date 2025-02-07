const express = require('express');
const {
  getNetworkProviders,
  getBundleOperators,
  getElectricityMerchants,
  getTVMerchants,
  getMerchantServices,
  buyAirtime,
  buyData,
  getMerchantAccount,
  payMerchant,
  getBanks,
  depositToBank,
  validateAccountNumber,
} = require('../controllers/paga-controllers');

const router = express.Router();

router.get('/get-operators', getNetworkProviders);
router.get('/get-electricity-merchants', getElectricityMerchants);
router.get('/get-tv-merchants', getTVMerchants);
router.get('/get-banks', getBanks);

// posts
router.post('/get-merchant-services', getMerchantServices);
router.post('/get-merchant-account', getMerchantAccount);
router.post('/get-bundle-operators', getBundleOperators);
router.post('/pay-merchant', payMerchant);
router.post('/buy-airtime', buyAirtime);
router.post('/buy-bundle', buyData);
router.post('/deposit-to-bank', depositToBank);
router.post('/validate-account-number', validateAccountNumber);

module.exports = router;
