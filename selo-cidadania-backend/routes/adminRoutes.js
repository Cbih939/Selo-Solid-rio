// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const db = require('../config/db');

// 1. ROTAS FIXAS (Devem vir primeiro)
router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.get('/all-users', adminController.getAllSystemUsers);
router.get('/roles', adminController.getAllRoles);

// ✅ COLOQUE A ROTA DE MANUTENÇÃO AQUI (Antes das rotas com :id)
router.put('/system-setup', async (req, res) => {
  const { maintenance_mode, maintenance_start_at, estimated_return_at } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE system_settings SET maintenance_mode = ?, maintenance_start_at = ?, estimated_return_at = ? WHERE id = 1',
      [maintenance_mode, maintenance_start_at, estimated_return_at]
    );
    res.json({ message: 'Configurações atualizadas!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no banco de dados' });
  }
});

// 2. ROTAS COM PARÂMETROS (Devem vir por último)
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);
router.put('/user/:id', adminController.updateSystemUser);
router.delete('/user/:id', adminController.deleteSystemUser);

module.exports = router;