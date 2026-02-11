const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// garante que o middleware seja uma função válida
const verify =
  typeof authMiddleware === 'function'
    ? authMiddleware
    : (authMiddleware.verifyToken ||
       authMiddleware.protect ||
       authMiddleware.auth);

if (!verify) {
  throw new Error("authMiddleware não exporta uma função de verificação.");
}

// ROTAS
router.post('/redeem-first-login', verify, redemptionController.redeemFirstLogin);
router.get('/my-redemptions', verify, redemptionController.getUserRedemptions);
router.post('/redeem', verify, redemptionController.redeemPrize);

module.exports = router;
