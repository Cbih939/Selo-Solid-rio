const express = require('express');
const router = express.Router();
const proofsController = require('../controllers/proofsController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// A correção principal está no upload.array('proof_files', 5)
router.post('/', authMiddleware, upload.array('proof_files', 5), proofsController.sendProof);

// Rota para buscar atividades
router.get('/activities', authMiddleware, proofsController.getActivities);

module.exports = router;