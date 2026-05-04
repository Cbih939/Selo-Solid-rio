const express = require('express');
const router = express.Router();
const proofsController = require('../controllers/proofsController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const { submitProof, getProofActivities, adminSubmitProof } = require('../controllers/proofController');

// A correção principal está no upload.array('proof_files', 5)
router.post('/', authMiddleware, upload.array('proof_files', 5), proofsController.sendProof);
router.put('/:id', protect, upload.array('files', 5), proofController.updateSocialProof);
router.post('/:id/update', protect, upload.array('files', 5), proofController.updateSocialProof); // Fallback de segurança

// Rota para buscar atividades
router.get('/activities', authMiddleware, proofsController.getActivities);

router.post('/admin-submit', verifyToken, adminSubmitProof);


module.exports = router;