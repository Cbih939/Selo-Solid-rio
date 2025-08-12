const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rotas existentes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id/profile', userController.getProfile);
router.put('/:id/profile', userController.updateProfile);
router.delete('/:id', userController.deleteUser);
router.put('/:id', userController.updateUser);
router.get('/:id/balance', userController.getUserBalance);

module.exports = router;