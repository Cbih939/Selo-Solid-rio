const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todos os Admins Nv.1
exports.getAllAdmins = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, name, email 
      FROM users 
      WHERE role_id = 2 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE: Cadastrar um novo Admin Nv.1
exports.createAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const role_id = 2;
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
      [name, email, password_hash, role_id]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Este email já está a ser utilizado." });
    }
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Editar os dados de um Admin Nv.1
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ? AND role_id = 2",
      [name, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin não encontrado ou não é Nível 1." });
    }
    res.status(200).json({ id, name, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir um Admin Nv.1
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ? AND role_id = 2", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin não encontrado ou não é Nível 1." });
    }
    res.status(200).json({ message: "Admin excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Listar todos os usuários do sistema (para Super Admin)
exports.getAllSystemUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.email, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `;
    const [users] = await db.query(query);
    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar todos os usuários do sistema:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// GET: Listar todos os perfis (roles) - NOVA FUNÇÃO
exports.getAllRoles = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT id, name FROM roles ORDER BY name ASC');
    res.status(200).json(roles);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// UPDATE: Atualizar um usuário do sistema
exports.updateSystemUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role_id } = req.body;

  if (!name || !email || !role_id) {
    return res.status(400).json({ message: "Nome, email e perfil são obrigatórios." });
  }

  try {
    await db.query(
      'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
      [name, email, role_id, id]
    );
    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar usuário do sistema:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// ==================================================================
// ### FUNÇÃO DE DELETAR USUÁRIO CORRIGIDA ###
// ==================================================================
exports.deleteSystemUser = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection(); // Usando a conexão do seu arquivo 'db'

    try {
        await connection.beginTransaction();

        // PASSO 1: Descobrir se o usuário é responsável por alguma ONG
        const [ongs] = await connection.query('SELECT id FROM ongs WHERE responsible_user_id = ?', [id]);

        if (ongs.length > 0) {
            // Se o usuário é responsável, não podemos simplesmente deletá-lo.
            // A regra de negócio aqui seria: ou impedir a exclusão, ou atribuir um novo responsável.
            // A opção mais segura é impedir.
            await connection.rollback();
            return res.status(400).json({ message: 'Não é possível excluir este usuário, pois ele é o responsável por uma ou mais ONGs. Por favor, atribua um novo responsável antes de excluir.' });
        }

        // PASSO 2: Deletar todos os registros "filhos" que apontam para este usuário
        await connection.query('DELETE FROM dependents WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM redemptions WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM social_proofs WHERE user_id = ?', [id]);
        // Adicione aqui outras tabelas que possam ter o user_id, se houver.

        // PASSO 3: Agora que os filhos foram removidos, deletar o usuário "pai"
        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Usuário e todos os seus dados associados foram excluídos com sucesso.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Erro ao deletar usuário do sistema:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor ao tentar deletar o usuário.' });
    } finally {
        if (connection) connection.release();
    }
};
