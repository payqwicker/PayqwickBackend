const express = require('express');
const { getKey, addKey } = require('../controllers/secret-key');

const router = express.Router();

router.get('/get-secrets', getKey);
router.post('/add-secrets', addKey);
module.exports = router;
