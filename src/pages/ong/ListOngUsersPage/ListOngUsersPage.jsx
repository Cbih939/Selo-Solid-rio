import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListOngUsersPage.module.css';
import { validatePassword } from '../../../utils/validators';

// Componente do Modal de Débito, agora totalmente funcional
const DebitModal = ({ user, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Garante que o valor é um número antes de enviar
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Por favor, insira um valor válido para o débito.");
      return;
    }
    onConfirm({ userId: user.id, amount: numericAmount, reason });
  };

  if (!user) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Debitar Saldo de Selos">
      <div className={styles.modalContent}>
        <p><strong>Beneficiário:</strong> {user.name}</p>
        <p><strong>Saldo Atual:</strong> {user.seal_balance} selos</p>
        <form onSubmit={handleSubmit}>
          <InputField 
            label="Valor a Debitar" 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            min="1"
          />
          <InputField 
            label="Motivo do Débito" 
            placeholder="Ex: Resgate de prêmio, ajuste, etc."
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            required 
          />
          <div className={styles.modalActions}>
            <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
            <Button type="submit">Confirmar Débito</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const ListOngUsersPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'seal_balance', label: 'Selos' }
  ];

  const fetchOngUsers = useCallback(async () => {
    if (user && user.ong_id) {
      try {
        const response = await api.get(`/ongs/${user.ong_id}/users`, { params: { search: searchTerm } });
        setUsers(response.data);
      } catch (error) { console.error("Erro ao buscar utilizadores da ONG:", error); }
    }
  }, [user, searchTerm]);

  useEffect(() => { fetchOngUsers(); }, [fetchOngUsers]);

  const openModal = (type, userToOpen) => {
    setSelectedUser(userToOpen);
    setModalType(type);
    if (type === 'edit') {
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  };
  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      // Atualiza os dados básicos do utilizador
      await api.put(`/users/${selectedUser.id}`, { name: selectedUser.name, email: selectedUser.email });

      // Se uma nova senha foi inserida, tenta redefini-la
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setErrors({ password: "As senhas não coincidem." });
          return;
        }
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
          setErrors({ password: "A nova senha não cumpre os requisitos." });
          return;
        }
        await api.put(`/users/${selectedUser.id}/reset-password`, { password: newPassword });
      }

      closeModal();
      fetchOngUsers();
    } catch (error) {
      console.error("Erro ao atualizar utilizador:", error);
      alert("Ocorreu um erro ao atualizar.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      closeModal();
      fetchOngUsers();
    } catch (error) {
      console.error("Erro ao excluir utilizador:", error);
      alert("Ocorreu um erro ao excluir.");
    }
  };

  // Função para confirmar o débito
  const handleConfirmDebit = async (debitData) => {
    try {
      await api.post('/ongs/debit-balance', debitData);
      alert('Débito realizado com sucesso!');
      closeModal();
      fetchOngUsers(); // Recarrega a lista para mostrar o novo saldo
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao realizar o débito.';
      alert(`Erro: ${errorMessage}`);
    }
  };

  return (
    <ContentWrapper title="Beneficiários da ONG">
      <div className={styles.header}>
        <p>Total de <strong>{users.length}</strong> Beneficiários cadastrados.</p>
        <InputField
          label="Pesquisar por nome ou email"
          name="search"
          placeholder="Digite para pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Table 
        headers={headers} 
        data={users} 
        onView={(userToView) => openModal('view', userToView)}
        onEdit={(userToEdit) => openModal('edit', userToEdit)}
        onDelete={(userToDelete) => openModal('delete', userToDelete)}
      />

      {/* Modal de Visualização -- BOTÃO DE DÉBITO ADICIONADO AQUI */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Detalhes do Beneficiário">
        {selectedUser && (
          <div className={styles.modalContent}>
            <p><strong>ID:</strong> {selectedUser.id}</p>
            <p><strong>Nome:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Saldo de Selos:</strong> {selectedUser.seal_balance}</p>
            <div className={styles.modalActions}>
              <Button onClick={() => openModal('debit', selectedUser)}>Debitar Saldo</Button>
              <Button variant="danger" onClick={() => openModal('delete', selectedUser)}>Excluir Beneficiário</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Edição */}
      <Modal isOpen={modalType === 'edit'} onClose={closeModal} title="Editar Beneficiário">
        {selectedUser && (
          <form onSubmit={handleUpdate}>
            <InputField label="Nome" name="name" value={selectedUser.name} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} />
            <InputField label="Email" name="email" type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} />
            
            <hr className={styles.divider} />
            
            <InputField label="Nova Senha (opcional)" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.password} />
            <InputField label="Confirmar Nova Senha" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={closeModal}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={modalType === 'delete'} onClose={closeModal} title="Confirmar Exclusão">
        {selectedUser && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir o Beneficiário <strong>{selectedUser.name}</strong>?</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* NOVO MODAL: Modal de Débito */}
      {modalType === 'debit' && selectedUser && (
        <DebitModal
          user={selectedUser}
          onClose={closeModal}
          onConfirm={handleConfirmDebit}
        />
      )}
    </ContentWrapper>
  );
};

export default ListOngUsersPage;