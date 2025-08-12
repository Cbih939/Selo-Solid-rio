import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import InputField from '../../../components/ui/InputField/InputField';
import api from '../../../api/api';
import styles from './ListAdminsPage.module.css';

const ListAdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
  ];

  // O useEffect agora é acionado sempre que 'searchTerm' muda.
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        // Envia o termo de pesquisa como um parâmetro para a API
        const response = await api.get('/admins', {
          params: { search: searchTerm }
        });
        setAdmins(response.data);
      } catch (error) {
        console.error("Erro ao buscar administradores:", error);
      }
    };

    // Adiciona um pequeno atraso para não fazer um pedido a cada tecla digitada
    const delayDebounceFn = setTimeout(() => {
      fetchAdmins();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditModalOpen(true);
  };

  const handleDelete = (admin) => {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admins/${selectedAdmin.id}`, selectedAdmin);
      setEditModalOpen(false);
      // Re-busca os dados para refletir a alteração
      const response = await api.get('/admins', { params: { search: searchTerm } });
      setAdmins(response.data);
    } catch (error) {
      console.error("Erro ao atualizar administrador:", error);
      alert("Ocorreu um erro ao atualizar.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admins/${selectedAdmin.id}`);
      setDeleteModalOpen(false);
      // Re-busca os dados para refletir a alteração
      const response = await api.get('/admins', { params: { search: searchTerm } });
      setAdmins(response.data);
    } catch (error) {
      console.error("Erro ao excluir administrador:", error);
      alert("Ocorreu um erro ao excluir.");
    }
  };

  return (
    <ContentWrapper title="Listar Admins Nível 1">
      <InputField
        label="Pesquisar por nome ou email"
        name="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Table 
        headers={headers} 
        data={admins} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Administrador">
        {selectedAdmin && (
          <form onSubmit={handleUpdate}>
            <InputField label="Nome" name="name" value={selectedAdmin.name} onChange={(e) => setSelectedAdmin({...selectedAdmin, name: e.target.value})} />
            <InputField label="Email" name="email" type="email" value={selectedAdmin.email} onChange={(e) => setSelectedAdmin({...selectedAdmin, email: e.target.value})} />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {selectedAdmin && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir o administrador <strong>{selectedAdmin.name}</strong>?</p>
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

export default ListAdminsPage;