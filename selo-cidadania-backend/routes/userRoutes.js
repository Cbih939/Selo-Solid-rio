// Arquivo: selo-cidadania-backend/routes/userRoutes.js

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
router.put('/:userId/attendance', ongCoordinator, userController.updateAttendance);

// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---
router.get('/me/dependents', protect, userController.getMyDependents);
router.post('/me/dependents', protect, userController.addMyDependent);
router.put('/me/dependents/:dependentId', protect, userController.updateMyDependent);
router.delete('/me/dependents/:dependentId', protect, userController.deleteMyDependent);
router.get('/me/profile', protect, userController.getProfile);
router.put('/me/profile', protect, userController.updateProfile);
router.get('/me/balance', protect, userController.getMyBalance);
router.post('/me/redeem-first-login', protect, userController.redeemFirstLoginBonus);
// Importe as novas funções lá em cima (se estiver usando destructuring)
// const { ping, getOnlineUsers } = require('../controllers/userController');

// E adicione as rotas abaixo:
// =========================================================================
// ROTAS DE USUÁRIOS ONLINE (HEARTBEAT) COM AUTENTICAÇÃO INTELIGENTE
// =========================================================================
const authMiddleware = require('../middlewares/authMiddleware');
let activeAuth = (req, res, next) => next();

if (typeof authMiddleware === 'function') {
    activeAuth = authMiddleware;
} else if (authMiddleware !== null && typeof authMiddleware === 'object') {
    const exportedFunctions = Object.values(authMiddleware).filter(val => typeof val === 'function');
    if (exportedFunctions.length > 0) activeAuth = exportedFunctions[0];
}

router.post('/ping', activeAuth, userController.ping);
router.get('/online', activeAuth, userController.getOnlineUsers);

// Atualização de perfil via ID (Protegida)
router.put('/:id/profile', protect, userController.updateUserProfile);
router.get('/:id', userController.getUserById);

// --- Rotas de Admin e Super Admin ---
router.get('/', admin, userController.getAllUsers);

// ++ NOVA ROTA: PERMITE AO ADMIN SIMULAR O LOGIN DE UM USUÁRIO (IMPERSONATE) ++
router.post('/:id/impersonate', admin, userController.impersonateUser);

module.exports = router;