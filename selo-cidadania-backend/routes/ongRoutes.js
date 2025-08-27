const express = require('express');
const router = express.Router();
const ongController = require('../controllers/ongController');
const upload = require('../middlewares/upload'); // Importa o middleware
const authMiddleware = require('../middlewares/authMiddleware');

// Garante que cada rota aponta para uma função exportada válida
router.get('/', ongController.getAllOngs);
// A rota POST agora usa o middleware para upload ANTES de chamar o controller.
router.post('/', 
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'ata_file', maxCount: 1 },
    { name: 'statute_file', maxCount: 1 }
  ]), 
  ongController.createOng
);
router.put('/:id', ongController.updateOng);
router.delete('/:id', ongController.deleteOng);
router.get('/:ongId/users', ongController.getOngUsers);
router.post('/debit-balance', authMiddleware, ongController.debitUserBalance);

module.exports = router;