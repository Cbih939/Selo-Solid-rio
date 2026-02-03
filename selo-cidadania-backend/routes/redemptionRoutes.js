const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota de bônus de primeiro login
// Certifique-se que o authMiddleware não é um objeto vazio
router.post('/redeem-first-login', authMiddleware, redemptionController.redeemFirstLogin);

// Histórico de resgates
router.get('/my-redemptions', authMiddleware, redemptionController.getUserRedemptions);

// Resgate de prêmio manual (se necessário)
router.post('/redeem', authMiddleware, redemptionController.redeemPrize);

module.exports = router;