// Arquivo: selo-cidadania-backend/utils/userAccess.js
// Regras de acesso aos dados de um beneficiário (dados pessoais e socioeconômicos).

const db = require('../config/db');

const STAFF_ROLES = ['admin5', 'admin1', 'ong'];

const isStaff = (requester) => !!requester && STAFF_ROLES.includes(requester.role);

/**
 * Retorna o beneficiário (id, name, ong_id) se o solicitante puder acessá-lo, ou null.
 * - O próprio usuário acessa os seus dados;
 * - admin5/admin1 acessam qualquer beneficiário;
 * - OSC acessa apenas beneficiários vinculados à sua ong_id.
 */
const findAccessibleUser = async (requester, userId) => {
  if (!requester) return null;
  const [rows] = await db.query('SELECT id, name, ong_id FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) return null;
  const target = rows[0];

  if (String(requester.id) === String(target.id)) return target;
  if (requester.role === 'admin5' || requester.role === 'admin1') return target;
  if (requester.role === 'ong' && requester.ong_id && String(requester.ong_id) === String(target.ong_id)) return target;
  return null;
};

module.exports = { STAFF_ROLES, isStaff, findAccessibleUser };
