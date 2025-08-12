const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');

router.post('/', redemptionController.redeemPrize);
router.get('/:userId', redemptionController.getUserRedemptions);

module.exports = router;