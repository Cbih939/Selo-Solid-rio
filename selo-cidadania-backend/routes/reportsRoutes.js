const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/stats', reportsController.getSystemStats);
router.get('/redemptions', reportsController.getAllRedemptions);
router.get('/ong/:ongId', reportsController.getOngStats);
router.get('/', reportsController.getReportsData);
router.get('/', reportsController.getReports);

module.exports = router;
