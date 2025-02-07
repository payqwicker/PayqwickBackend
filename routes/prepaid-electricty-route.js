const express = require('express');
const {
  confirmCustomer,
  creditVend,
  trialCreditVend,
  // freeBasicElectricty,
  // rePrint,
  // updateMeterKey,
  // confirmMeterDetails,
  // eskomPayAccount,
  // customerReportFault,
  // verifyToken,
} = require('../controllers/prepaid-electric-controllers');

const router = express.Router();

router.post('/confirm-customer', confirmCustomer);
router.post('/credit-vendor', creditVend);
router.post('/trial-credit-vendor', trialCreditVend);
// router.post('/free-basic-electricty', freeBasicElectricty);
// router.post('/re-print', rePrint);
// router.put('/update-meter-key', updateMeterKey);
// router.post('/confirm-meter-details', confirmMeterDetails);
// router.post('/eskom-pay-account', eskomPayAccount);
// router.post('/customer-report-fault', customerReportFault);
// router.post('/verify-token', verifyToken);

module.exports = router;