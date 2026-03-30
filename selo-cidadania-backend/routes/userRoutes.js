const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { admin, ongCoordinator, protect } = require('../middlewares/authMiddleware');

// --- Rotas para Coordenadores de ONG ---
router.post('/', ongCoordinator, userController.createUser);
router.get('/:id/details', ongCoordinator, userController.getUserDetails);
router.put('/:id', ongCoordinator, userController.updateUser);
router.put('/:id/reset-password', ongCoordinator, userController.resetPassword);
router.delete('/:id', ongCoordinator, userController.deleteUser);
router.post('/:userId/debit-seals', ongCoordinator, userController.debitSeals);
router.post('/send-seals', ongCoordinator, userController.sendSeals);

// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---
router.get('/me/dependents', protect, userController.getMyDependents);
router.post('/me/dependents', protect, userController.addMyDependent);
router.put('/me/dependents/:dependentId', protect, userController.updateMyDependent);
router.delete('/me/dependents/:dependentId', protect, userController.deleteMyDependent);
router.get('/me/profile', protect, userController.getProfile);
router.put('/me/profile', protect, userController.updateProfile);
router.get('/me/balance', protect, userController.getMyBalance);

// A famosa linha 22 - Simplificada
router.post('/me/redeem-first-login', protect, (req, res) => res.status(200).json({message: "Ok"}));

router.put('/:id/profile', protect, userController.updateUserProfile);
router.get('/:id', userController.getUserById);

// --- Rotas de Admin ---
router.get('/', admin, userController.getAllUsers);

module.exports = router;