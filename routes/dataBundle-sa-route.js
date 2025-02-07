const express = require('express');
const {
    dataBundleProviders,
    buyDataBundle,
} = require('../controllers/buy-sa-data-controller');

const router = express.Router();

router.post('/data-providers', dataBundleProviders);
router.post('/bundle', buyDataBundle);

module.exports = router;