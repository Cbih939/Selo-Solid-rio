import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/api';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import styles from './ListAllUsersPage.module.css';

const ListAllUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para pesquisa e ações
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estado local para o formulário de edição
  const [formData, setFormData] = useState({ name: '', email: '', role_id: '' });

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get('/admins/all-users'),
        api.get('/admins/roles')
      ]);
      
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
    } catch (err) {
      setError('Não foi possível carregar os dados do sistema.');
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  // Filtro de pesquisa rápida
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  // --- AÇÕES DE EDIÇÃO ---
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role_id: user.role_id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/admins/user/${editingUser.id}`, formData);
      
      const updatedRoleName = roles.find(r => String(r.id) === String(formData.role_id))?.name || editingUser.role;
      
      setUsers(currentUsers => currentUsers.map(user => 
        user.id === editingUser.id ? { ...user, ...formData, role: updatedRoleName } : user
      ));
      
      setIsEditModalOpen(false);
      alert('Acesso atualizado com sucesso!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Não foi possível salvar as alterações.';
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- AÇÕES DE EXCLUSÃO ---
  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/admins/user/${userToDelete.id}`);
      setUsers(currentUsers => currentUsers.filter(user => user.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      alert('Usuário excluído com sucesso.');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Não foi possível excluir o usuário.';
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentWrapper title="Gestão Global de Acessos">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Controlo de Utilizadores e Perfis</h2>
        <p className={styles.introText}>
          Faça a gestão de todas as contas registadas no sistema (Administradores, OSCs e Beneficiários). Altere permissões de acesso ou remova contas ativas.
        </p>
      </div>

      <div className={styles.container}>
        
        {/* Barra de Pesquisa */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Pesquisar por nome, e-mail ou perfil..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className={styles.searchInput} 
            />
          </div>
          <div className={styles.resultsCount}>
            Total: <strong>{filteredUsers.length}</strong> conta(s)
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>A carregar base de dados...</p>
          </div>
        ) : error && users.length === 0 ? (
          <div className={styles.errorState}>
            <p>⚠️ {error}</p>
            <Button onClick={fetchUsersAndRoles} variant="secondary">Tentar Novamente</Button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Identificação do Utilizador</th>
                  <th>E-mail de Acesso</th>
                  <th className={styles.textCenter}>Perfil (Role)</th>
                  <th className={styles.textRight}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className={styles.idCell}>#{user.id}</td>
                    <td className={styles.nameCell}>
                      <span className={styles.avatarSm}>{user.name?.charAt(0).toUpperCase() || '?'}</span>
                      <strong>{user.name}</strong>
                    </td>
                    <td className={styles.emailCell}>{user.email}</td>
                    <td className={styles.textCenter}>
                      <span className={`${styles.roleBadge} ${styles[`role_${user.role}`] || styles.role_default}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={styles.textRight}>
                      <div className={styles.actionButtons}>
                        <button onClick={() => handleOpenEdit(user)} className={styles.editBtn}>✏️ Editar</button>
                        <button onClick={() => handleOpenDelete(user)} className={styles.deleteBtn}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className={styles.emptyMessage}>Nenhuma conta encontrada para a sua pesquisa.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* MODAL DE EDIÇÃO DE ACESSO               */}
      {/* ======================================= */}
      <Modal isOpen={isEditModalOpen} onClose={() => !isSubmitting && setIsEditModalOpen(false)} title="Editar Conta de Acesso">
        {editingUser && (
          <form onSubmit={handleSaveEdit} className={styles.modalForm}>
            <div className={styles.inputGroup}>
              <InputField 
                label="Nome Completo" 
                name="name" 
                value={formData.name} 
                onChange={handleFormChange} 
                required 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <InputField 
                label="E-mail de Login" 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleFormChange} 
                required 
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.customLabel}>Nível de Acesso (Perfil) *</label>
              <select 
                name="role_id" 
                className={styles.customSelect}
                value={formData.role_id} 
                onChange={handleFormChange} 
                required
              >
                <option value="" disabled>Selecione um perfil...</option>
                {Array.isArray(roles) && roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <small className={styles.helperText}>Cuidado ao alterar permissões de Super Administrador.</small>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} disabled={isSubmitting}>
                {isSubmitting ? 'A Salvar...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================= */}
      {/* MODAL DE EXCLUSÃO                       */}
      {/* ======================================= */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => !isSubmitting && setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
        {userToDelete && (
          <div className={styles.deleteModalContent}>
            <p>Tem a certeza que deseja excluir a conta de <strong>{userToDelete.name}</strong>?</p>
            <p className={styles.warningText}>Esta ação apagará permanentemente o acesso deste utilizador ao sistema.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'A Excluir...' : 'Sim, Excluir Conta'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </ContentWrapper>
  );
};

export default ListAllUsersPage;