import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import InputField from '../../../components/ui/InputField/InputField'; // Importa o InputField
import api from '../../../api/api';
import styles from './ListPrizesPage.module.css';

const ListPrizesPage = () => {
  const [prizes, setPrizes] = useState([]);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'cost', label: 'Custo (Selos)' }
  ];

  const fetchPrizes = async () => {
    try {
      const response = await api.get('/prizes');
      setPrizes(response.data);
    } catch (error) {
      console.error("Erro ao buscar prémios:", error);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const handleEdit = (prize) => {
    setSelectedPrize(prize);
    setEditModalOpen(true);
  };

  const handleDelete = (prize) => {
    setSelectedPrize(prize);
    setDeleteModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/prizes/${selectedPrize.id}`, selectedPrize);
      setEditModalOpen(false);
      fetchPrizes(); // Atualiza a lista com os novos dados
    } catch (error) {
      console.error("Erro ao atualizar prémio:", error);
      alert("Ocorreu um erro ao atualizar o prémio.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/prizes/${selectedPrize.id}`);
      setDeleteModalOpen(false);
      fetchPrizes(); // Atualiza a lista após a exclusão
    } catch (error) {
      console.error("Erro ao excluir prémio:", error);
      alert(error.response?.data?.message || "Ocorreu um erro ao excluir o prémio.");
    }
  };

  return (
    <ContentWrapper title="Listar Prêmios">
      <Table 
        headers={headers} 
        data={prizes} 
        onEdit={handleEdit} // Passa a função de edição para a tabela
        onDelete={handleDelete}
      />

      {/* Modal de Edição */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        title="Editar Prêmio"
      >
        {selectedPrize && (
          <form onSubmit={handleUpdate}>
            <InputField 
              label="Nome do Prêmio"
              name="name"
              value={selectedPrize.name}
              onChange={(e) => setSelectedPrize({...selectedPrize, name: e.target.value})}
            />
            <InputField 
              label="Custo em Selos"
              name="cost"
              type="number"
              value={selectedPrize.cost}
              onChange={(e) => setSelectedPrize({...selectedPrize, cost: e.target.value})}
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="Confirmar Exclusão"
      >
        {selectedPrize && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir o prêmio <strong>{selectedPrize.name}</strong>?</p>
            <p>Esta ação não pode ser desfeita.</p>
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

export default ListPrizesPage;
