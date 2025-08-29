import React, { useState, useEffect } from 'react';
import api from '../../../api/api';
import styles from './ListAllUsersPage.module.css';

// Componente do Modal de Edição
const EditUserModal = ({ user, roles, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...user });

  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Editar Usuário</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="role_id">Perfil</label>
            <select
              id="role_id"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
            >
              {/* ===================================================================== */}
              {/* CORREÇÃO APLICADA AQUI: */}
              {/* Garante que 'roles' é um array antes de tentar usar .map(). */}
              {/* Isso previne o erro caso a API de roles falhe mas a de users não. */}
              {/* ===================================================================== */}
              {Array.isArray(roles) && roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente da Página Principal
const ListAllUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get('/admins/all-users'),
        api.get('/admins/roles')
      ]);
      
      // Garante que estamos sempre trabalhando com arrays, mesmo se a API retornar algo inesperado.
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);

    } catch (err) {
      setError('Não foi possível carregar os dados.');
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await api.delete(`/admins/user/${userId}`);
        setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
        alert('Usuário excluído com sucesso.');
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Não foi possível excluir o usuário.';
        setError(errorMessage);
        alert(`Erro: ${errorMessage}`);
        console.error('Erro ao excluir usuário:', err);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleSave = async (updatedUser) => {
    try {
      await api.put(`/admins/user/${updatedUser.id}`, {
        name: updatedUser.name,
        email: updatedUser.email,
        role_id: updatedUser.role_id
      });
      
      const updatedRoleName = roles.find(r => r.id == updatedUser.role_id)?.name || updatedUser.role;
      
      setUsers(currentUsers => currentUsers.map(user => 
        user.id === updatedUser.id ? { ...updatedUser, role: updatedRoleName } : user
      ));
      
      setEditingUser(null);
      alert('Usuário atualizado com sucesso.');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Não foi possível salvar as alterações.';
      setError(errorMessage);
      alert(`Erro: ${errorMessage}`);
      console.error('Erro ao salvar usuário:', err);
    }
  };

  if (loading) {
    return <div className={styles.container}><p>A carregar usuários...</p></div>;
  }

  if (error && !Array.isArray(users) && users.length === 0) {
    return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>Todos os Usuários do Sistema</h1>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Adicionando a mesma proteção aqui por consistência e segurança. */}
            {Array.isArray(users) && users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td className={styles.roleCell}>{user.role}</td>
                <td className={styles.actionsCell}>
                  <button onClick={() => handleEdit(user)} className={`${styles.actionButton} ${styles.editButton}`}>Editar</button>
                  <button onClick={() => handleDelete(user.id)} className={`${styles.actionButton} ${styles.deleteButton}`}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <EditUserModal
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default ListAllUsersPage;
