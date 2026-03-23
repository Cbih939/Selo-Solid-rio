const db = require('../config/db'); // Seu arquivo de conexão

const maintenanceMiddleware = async (req, res, next) => {
  try {
    const [settings] = await db.query('SELECT * FROM system_settings LIMIT 1');
    
    if (settings && settings.maintenance_mode) {
      // Permitir apenas o Super Admin (ajuste conforme sua lógica de roles)
      if (req.user && req.user.role === 'super_admin') {
        return next();
      }

      return res.status(503).json({
        maintenance: true,
        message: "O sistema está em manutenção.",
        estimated_return: settings.estimated_return_at
      });
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = maintenanceMiddleware;