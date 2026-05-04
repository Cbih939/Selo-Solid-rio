// Arquivo: selo-cidadania-backend/routes/socialProofRoutes.js

const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

// Rotas existentes
router.get('/ongs-list', socialProofController.getAllOngs);
router.get('/activities/ong/:ongId', socialProofController.getActivitiesByOng);
router.post('/activities', upload.single('activity_image'), socialProofController.createActivity);
router.put('/activities/:id', upload.single('activity_image'), socialProofController.updateActivity);
router.delete('/activities/:id', socialProofController.deleteActivity);

router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);

// Rota do log de auditoria
router.get('/log/:ongId', socialProofController.getEvaluationLog); 

router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);
router.put('/:proofId/resubmit', socialProofController.requestResubmission);

// =========================================================================
// ROTA DE CATÁLOGO DE ATIVIDADES COM AUTENTICAÇÃO INTELIGENTE
// =========================================================================
const authMiddleware = require('../middlewares/authMiddleware');
let activeAuth = (req, res, next) => next();

if (typeof authMiddleware === 'function') {
    activeAuth = authMiddleware;
} else if (authMiddleware !== null && typeof authMiddleware === 'object') {
    const exportedFunctions = Object.values(authMiddleware).filter(val => typeof val === 'function');
    if (exportedFunctions.length > 0) activeAuth = exportedFunctions[0];
}

router.get('/activities', activeAuth, socialProofController.getActivitiesList);

module.exports = router;