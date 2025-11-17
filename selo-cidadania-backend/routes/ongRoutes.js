// Arquivo: routes/ongRoutes.js

const express = require('express');
const router = express.Router();
const ongController = require('../controllers/ongController');
const upload = require('../middlewares/upload');

// === CORREÇÃO: Importação do middleware que estava faltando ===
const { ongCoordinator } = require('../middlewares/authMiddleware'); 
// ==============================================================

// Rota GET para listar todas as ONGs
router.get('/', ongController.getAllOngs);

// Rota GET para buscar uma ONG por ID
router.get('/:id', ongController.getOngById);

// Rota POST para criar uma nova ONG
router.post('/', 
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'ata_file', maxCount: 1 },
    { name: 'statute_file', maxCount: 1 }
  ]), 
  ongController.createOng
);

// Rota PUT para atualizar uma ONG por ID
router.put('/:id', 
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'ata_file', maxCount: 1 },
    { name: 'statute_file', maxCount: 1 }
  ]), 
  ongController.updateOng
);

// Rota DELETE para excluir uma ONG
router.delete('/:id', ongController.deleteOng);

// Rota GET para listar os usuários de uma ONG
router.get('/:ongId/users', ongController.getOngUsers);

// Rota POST para debitar o saldo de um usuário
router.post('/debit-balance', ongController.debitUserBalance);

// --- NOVAS ROTAS PARA GESTÃO DE ADMINISTRADORES DA ONG ---
// Estas rotas usam o 'ongCoordinator', por isso a importação no topo é obrigatória

// Listar administradores
router.get('/:id/admins', ongCoordinator, ongController.getOngAdmins);

// Adicionar novo administrador
router.post('/:id/admins', ongCoordinator, ongController.addOngAdmin);

// Remover administrador
router.delete('/:id/admins/:userId', ongCoordinator, ongController.removeOngAdmin);

module.exports = router;