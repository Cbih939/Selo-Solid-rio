const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota que o Frontend está tentando chamar
router.post('/redeem-first-login', authMiddleware, redemptionController.redeemFirstLogin);

// Outras rotas de resgate
router.get('/my-redemptions', authMiddleware, redemptionController.getUserRedemptions);

module.exports = router;