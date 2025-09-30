const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas existentes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);

router.get('/:id', userController.getUserDetails); 
router.get('/:id/profile', userController.getProfile);
router.put('/:id/profile', userController.updateProfile);
router.delete('/:id', userController.deleteUser);
router.put('/:id', userController.updateUser);
router.get('/:id/balance', userController.getUserBalance);
router.put('/:id/reset-password', userController.resetPassword);
router.post('/:userId/debit-seals', authMiddleware, userController.debitSeals);

// --- NOVAS ROTAS PARA GESTÃO DE DEPENDENTES ---
// O 'authMiddleware' garante que apenas o usuário logado aceda a estas rotas
router.get('/me/dependents', authMiddleware, userController.getDependents);
router.post('/me/dependents', authMiddleware, userController.addDependent);
router.put('/me/dependents/:dependentId', authMiddleware, userController.updateDependent);
router.delete('/me/dependents/:dependentId', authMiddleware, userController.deleteDependent);
router.post('/:userId/debit-seals', authMiddleware, userController.debitSeals);

module.exports = router;
