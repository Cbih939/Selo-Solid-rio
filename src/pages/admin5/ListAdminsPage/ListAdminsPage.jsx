// Arquivo: src/pages/admin5/ListAdminsPage/ListAdminsPage.jsx

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
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
    setIsSubmitting(true);
    try {
      await api.put(`/admins/${selectedAdmin.id}`, selectedAdmin);
      setEditModalOpen(false);
      // Re-busca os dados para refletir a alteração
      const response = await api.get('/admins', { params: { search: searchTerm } });
      setAdmins(response.data);
    } catch (error) {
      console.error("Erro ao atualizar administrador:", error);
      alert("Ocorreu um erro ao atualizar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await api.delete(`/admins/${selectedAdmin.id}`);
      setDeleteModalOpen(false);
      // Re-busca os dados para refletir a alteração
      const response = await api.get('/admins', { params: { search: searchTerm } });
      setAdmins(response.data);
    } catch (error) {
      console.error("Erro ao excluir administrador:", error);
      alert("Ocorreu um erro ao excluir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentWrapper title="Listar Admins Nível 1">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Gestão de Administradores</h2>
        <p className={styles.introText}>
          Abaixo encontra-se a lista de todos os Administradores de Nível 1 da plataforma. Utilize a barra de pesquisa para localizar rapidamente um utilizador específico.
        </p>
      </div>

      <div className={styles.filterSection}>
        <InputField
          label="🔍 Pesquisar Administrador"
          name="search"
          placeholder="Digite o nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        <Table 
          headers={headers} 
          data={admins} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Administrador">
        {selectedAdmin && (
          <form onSubmit={handleUpdate} className={styles.modalForm}>
            <InputField 
              label="Nome Completo" 
              name="name" 
              value={selectedAdmin.name} 
              onChange={(e) => setSelectedAdmin({...selectedAdmin, name: e.target.value})} 
            />
            <InputField 
              label="E-mail de Acesso" 
              name="email" 
              type="email" 
              value={selectedAdmin.email} 
              onChange={(e) => setSelectedAdmin({...selectedAdmin, email: e.target.value})} 
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} disabled={isSubmitting}>
                {isSubmitting ? 'A Salvar...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {selectedAdmin && (
          <div className={styles.modalContent}>
            <p className={styles.warningText}>
              Tem a certeza de que deseja excluir o administrador <strong>{selectedAdmin.name}</strong>?
            </p>
            <p className={styles.subWarningText}>
              Esta ação é irreversível e removerá o acesso deste utilizador ao sistema.
            </p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'A Excluir...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </ContentWrapper>
  );
};

export default ListAdminsPage;