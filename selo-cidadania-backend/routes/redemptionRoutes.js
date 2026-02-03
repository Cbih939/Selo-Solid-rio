const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Verificação dinâmica: tenta usar como função ou busca 'verifyToken' / 'protect'
const verify = typeof authMiddleware === 'function' 
    ? authMiddleware 
    : (authMiddleware.verifyToken || authMiddleware.protect || authMiddleware.auth);

// Certifique-se de que 'verify' não é undefined aqui
if (!verify) {
    console.error("ERRO CRÍTICO: authMiddleware não carregou uma função válida!");
}

router.post('/redeem-first-login', verify, redemptionController.redeemFirstLogin);
router.get('/my-redemptions', verify, redemptionController.getUserRedemptions);
router.post('/redeem', verify, redemptionController.redeemPrize);

module.exports = router;