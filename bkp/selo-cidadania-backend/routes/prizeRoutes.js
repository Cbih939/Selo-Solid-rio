const express = require('express');
const router = express.Router();
const prizeController = require('../controllers/prizeController');

router.get('/', prizeController.getAllPrizes);
router.post('/', prizeController.createPrize);
router.put('/:id', prizeController.updatePrize);
router.delete('/:id', prizeController.deletePrize);

module.exports = router;
