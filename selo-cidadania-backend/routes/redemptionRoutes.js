const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Verificação de segurança: se o middleware for um objeto, pegue a propriedade correta
// Se o seu authMiddleware exporta como { verifyToken }, mude para authMiddleware.verifyToken
const verify = typeof authMiddleware === 'function' ? authMiddleware : authMiddleware.verifyToken;

// Linha 8: Rota de bônus
router.post('/redeem-first-login', verify, redemptionController.redeemFirstLogin);

// Outras rotas
router.get('/my-redemptions/:userId', verify, redemptionController.getUserRedemptions);
router.post('/redeem', verify, redemptionController.redeemPrize);

module.exports = router;