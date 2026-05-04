const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

// =========================================================================
// 1. CONFIGURAÇÃO DE AUTENTICAÇÃO INTELIGENTE (No topo para evitar erros)
// =========================================================================
const authMiddleware = require('../middlewares/authMiddleware');
let activeAuth = (req, res, next) => next();

if (typeof authMiddleware === 'function') {
    activeAuth = authMiddleware;
} else if (authMiddleware !== null && typeof authMiddleware === 'object') {
    const exportedFunctions = Object.values(authMiddleware).filter(val => typeof val === 'function');
    if (exportedFunctions.length > 0) activeAuth = exportedFunctions[0];
}

// =========================================================================
// 2. ROTAS DA APLICAÇÃO
// =========================================================================
router.get('/ongs-list', socialProofController.getAllOngs);
router.get('/activities/ong/:ongId', socialProofController.getActivitiesByOng);
router.post('/activities', upload.single('activity_image'), socialProofController.createActivity);
router.put('/activities/:id', upload.single('activity_image'), socialProofController.updateActivity);
router.delete('/activities/:id', socialProofController.deleteActivity);

router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
router.get('/log/:ongId', socialProofController.getEvaluationLog); 

router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);
router.put('/:proofId/resubmit', socialProofController.requestResubmission);

// Rota corrigida usando o activeAuth (Sem deixar rastro do verifyToken antigo)
router.get('/activities', activeAuth, socialProofController.getActivitiesList);

module.exports = router;