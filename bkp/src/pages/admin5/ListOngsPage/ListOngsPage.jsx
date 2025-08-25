import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListOngsPage.module.css';

const ListOngsPage = () => {
  const [ongs, setOngs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'responsible_name', label: 'Responsável' },
    { key: 'contact_email', label: 'Email' },
  ];

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs', {
          params: { search: searchTerm }
        });
        setOngs(response.data);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchOngs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleEdit = (ong) => {
    setSelectedOng(ong);
    setEditModalOpen(true);
  };

  const handleDelete = (ong) => {
    setSelectedOng(ong);
    setDeleteModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ongs/${selectedOng.id}`, selectedOng);
      setEditModalOpen(false);
      const response = await api.get('/ongs', { params: { search: searchTerm } });
      setOngs(response.data);
    } catch (error) {
      console.error("Erro ao atualizar ONG:", error);
      alert("Ocorreu um erro ao atualizar a ONG.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/ongs/${selectedOng.id}`);
      setDeleteModalOpen(false);
      const response = await api.get('/ongs', { params: { search: searchTerm } });
      setOngs(response.data);
    } catch (error) {
      console.error("Erro ao excluir ONG:", error);
      alert("Ocorreu um erro ao excluir a ONG.");
    }
  };

  return (
    <ContentWrapper title="Listar ONGs">
      <InputField label="Pesquisar por nome, responsável ou email" name="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <Table headers={headers} data={ongs} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar ONG">
        {selectedOng && (
          <form onSubmit={handleUpdate}>
            <InputField label="Nome Fantasia" name="fantasy_name" value={selectedOng.fantasy_name} onChange={(e) => setSelectedOng({...selectedOng, fantasy_name: e.target.value})} />
            <InputField label="Email de Contato" name="contact_email" value={selectedOng.contact_email} onChange={(e) => setSelectedOng({...selectedOng, contact_email: e.target.value})} />
            <InputField label="Telefone" name="phone" value={selectedOng.phone} onChange={(e) => setSelectedOng({...selectedOng, phone: e.target.value})} />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {selectedOng && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir a ONG <strong>{selectedOng.fantasy_name}</strong>?</p>
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

export default ListOngsPage;