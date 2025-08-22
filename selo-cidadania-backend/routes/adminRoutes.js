const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);
router.get('/all-users', adminController.getAllSystemUsers);
router.get('/roles', adminController.getAllRoles);
router.put('/user/:id', adminController.updateSystemUser);
router.delete('/user/:id', adminController.deleteSystemUser);

module.exports = router;