const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { admin, ongCoordinator, protect } = require('../middlewares/authMiddleware');

// --- Rotas para Coordenadores de ONG ---
router.post('/', ongCoordinator, userController.createUser);
router.get('/:id/details', ongCoordinator, userController.getUserDetails);
router.put('/:id', ongCoordinator, userController.updateUser); // <-- Esta era a rota que estava a bloquear!
router.put('/:id/reset-password', ongCoordinator, userController.resetPassword);
router.delete('/:id', ongCoordinator, userController.deleteUser);
router.post('/:userId/debit-seals', ongCoordinator, userController.debitSeals);

// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---
router.get('/me/dependents', protect, userController.getMyDependents);
router.post('/me/dependents', protect, userController.addMyDependent);
router.put('/me/dependents/:dependentId', protect, userController.updateMyDependent);
router.delete('/me/dependents/:dependentId', protect, userController.deleteMyDependent);
router.get('/me/profile', protect, userController.getProfile);
router.put('/me/profile', protect, userController.updateProfile);
router.get('/me/balance', protect, userController.getMyBalance);
router.post('/me/redeem-first-login', protect, userController.redeemFirstLoginBonus);

// ++ NOVA ROTA LIVRE PARA O UTILIZADOR EDITAR O SEU PERFIL ++
router.put('/:id/profile', protect, userController.updateUserProfile);

router.get('/:id', userController.getUserById);

// --- Rotas de Admin ---
router.get('/', admin, userController.getAllUsers);

module.exports = router;