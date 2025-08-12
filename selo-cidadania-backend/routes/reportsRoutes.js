const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/stats', reportsController.getSystemStats);
router.get('/redemptions', reportsController.getAllRedemptions);

module.exports = router;
