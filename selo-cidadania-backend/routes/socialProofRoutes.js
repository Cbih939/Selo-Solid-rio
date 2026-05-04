const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

router.get('/ongs-list', socialProofController.getAllOngs);
router.get('/activities/ong/:ongId', socialProofController.getActivitiesByOng);
router.post('/activities', upload.single('activity_image'), socialProofController.createActivity);
router.put('/activities/:id', upload.single('activity_image'), socialProofController.updateActivity);
router.delete('/activities/:id', socialProofController.deleteActivity);

router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
// ++ NOVA ROTA DO LOG DE AUDITORIA ++
router.get('/log/:ongId', socialProofController.getEvaluationLog); 

router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);
router.put('/:proofId/resubmit', socialProofController.requestResubmission);
router.get('/activities', verifyToken, socialProofController.getActivitiesList);

module.exports = router;