const express = require('express');
const router = express.Router();
const ongController = require('../controllers/ongController');

// Garante que cada rota aponta para uma função exportada válida
router.get('/', ongController.getAllOngs);
router.post('/', ongController.createOng);
router.put('/:id', ongController.updateOng);
router.delete('/:id', ongController.deleteOng);
router.get('/:ongId/users', ongController.getOngUsers);

module.exports = router;