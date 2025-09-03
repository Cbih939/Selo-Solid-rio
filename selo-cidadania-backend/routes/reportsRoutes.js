const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/', reportsController.getReports);
router.get('/stats', reportsController.getSystemStats);
router.get('/redemptions', reportsController.getAllRedemptions);
router.get('/ong/:ongId', reportsController.getOngStats);
router.get('/', reportsController.getReportsData);

module.exports = router;
