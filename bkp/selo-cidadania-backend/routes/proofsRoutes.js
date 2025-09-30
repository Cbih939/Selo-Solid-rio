const express = require('express');
const router = express.Router();
const proofsController = require('../controllers/proofsController');
const upload = require('../middlewares/upload'); // importa o middleware de upload

// Rota para enviar múltiplos arquivos (até 5)
router.post('/', upload.array('proof_files', 5), proofsController.createProof);

module.exports = router;
