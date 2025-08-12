import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListUsersPage.module.css';

const ListUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'seal_balance', label: 'Selos' }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users', {
          params: { search: searchTerm }
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Erro ao buscar utilizadores:", error);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser.id}`, selectedUser);
      setEditModalOpen(false);
      const response = await api.get('/users', { params: { search: searchTerm } });
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao atualizar utilizador:", error);
      alert("Ocorreu um erro ao atualizar.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setDeleteModalOpen(false);
      const response = await api.get('/users', { params: { search: searchTerm } });
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao excluir utilizador:", error);
      alert("Ocorreu um erro ao excluir o utilizador.");
    }
  };

  return (
    <ContentWrapper title="Listar Usuários">
      <InputField label="Pesquisar por nome ou email" name="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <Table headers={headers} data={users} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Usuário">
        {selectedUser && (
          <form onSubmit={handleUpdate}>
            <InputField label="Nome" name="name" value={selectedUser.name} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} />
            <InputField label="Email" name="email" type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {selectedUser && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir o usuário <strong>{selectedUser.name}</strong>?</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>
    </ContentWrapper>
  );
};

export default ListUsersPage;