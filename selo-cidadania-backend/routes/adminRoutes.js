// Arquivo: routes/adminRoutes.js (ATUALIZADO)

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const db = require('../config/db'); // Importação do banco necessária para a nova rota

// Rota para buscar administradores
router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

// Rota para gestão de usuários do sistema
router.get('/all-users', adminController.getAllSystemUsers);
router.get('/roles', adminController.getAllRoles);
router.put('/user/:id', adminController.updateSystemUser);
router.delete('/user/:id', adminController.deleteSystemUser);

/** * ✅ NOVA ROTA: Controle de Manutenção do Sistema
 * Esta rota permite que o Super Admin (admin5) trave o sistema.
 */
router.put('/system-setup', async (req, res) => {
  const { maintenance_mode, estimated_return_at } = req.body;

  try {
    // 1. Atualiza as configurações globais na tabela system_settings
    // Usamos WHERE id = 1 pois só existe uma configuração global
    const [result] = await db.query(
      'UPDATE system_settings SET maintenance_mode = ?, estimated_return_at = ? WHERE id = 1',
      [maintenance_mode, estimated_return_at]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Configurações de sistema não encontradas.' });
    }

    console.log(`⚠️ Modo Manutenção alterado para: ${maintenance_mode}`);
    res.json({ message: 'Configurações de sistema atualizadas com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar modo manutenção:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar o banco de dados.' });
  }
});

module.exports = router;