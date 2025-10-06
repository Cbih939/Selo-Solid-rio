// Arquivo: pages/ListOngUsersPage/ListOngUsersPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListOngUsersPage.module.css';
import { validatePassword } from '../../../utils/validators';

// ==================================================================
// COMPONENTES INTERNOS E FUNÇÕES UTILITÁRIAS
// ==================================================================

// --- Modal de Débito ---
const DebitModal = ({ user, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Por favor, insira um valor de débito válido.");
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
          <InputField label="Valor a Debitar" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" />
          <InputField label="Motivo do Débito (Opcional)" placeholder="Ex: Resgate de cesta básica" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className={styles.modalActions}>
            <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
            <Button type="submit">Confirmar Débito</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// --- Função Utilitária para Formatar Data (CORRIGIDA) ---
const formatDate = (dateString) => {
  // ++ INÍCIO DA CORREÇÃO: Verifica se a data é nula ou inválida ++
  if (!dateString) {
    return 'N/A'; // Retorna 'Não Aplicável' se a data for nula
  }
  const date = new Date(dateString);
  // Verifica se a data é válida após a conversão
  if (isNaN(date.getTime())) {
    return 'Data Inválida';
  }
  // Adiciona 1 dia para corrigir problemas de fuso horário
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString('pt-BR');
  // ++ FIM DA CORREÇÃO ++
};


// ==================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ==================================================================
const ListOngUsersPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'cpf', label: 'CPF' },
    { key: 'seal_balance', label: 'Selos' }
  ];

  const fetchOngUsers = useCallback(async () => {
    if (user && user.ong_id) {
      try {
        const response = await api.get(`/ongs/${user.ong_id}/users`, { params: { search: searchTerm } });
        setUsers(response.data);
      } catch (error) { console.error("Erro ao buscar usuários da ONG:", error); }
    }
  }, [user, searchTerm]);

  useEffect(() => { fetchOngUsers(); }, [fetchOngUsers]);

  const openModal = (type, userToOpen) => {
    setModalType(type);
    setSelectedUser(userToOpen);
    if (type === 'edit') {
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  const handleViewDetails = async (userToView) => {
    setModalType('view');
    setLoadingDetails(true);
    try {
      const response = await api.get(`/users/${userToView.id}/details`);
      setSelectedUser(response.data);
    } catch (error) {
      console.error("Erro ao buscar detalhes do usuário:", error);
      alert("Não foi possível carregar os detalhes do usuário.");
      setSelectedUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await api.put(`/users/${selectedUser.id}`, { name: selectedUser.name, email: selectedUser.email });
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
      alert("Usuário atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Ocorreu um erro ao atualizar.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      closeModal();
      fetchOngUsers();
      alert("Usuário excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Ocorreu um erro ao excluir.");
    }
  };

  const handleConfirmDebit = async (debitData) => {
    try {
      await api.post(`/users/${debitData.userId}/debit-seals`, { amount: debitData.amount, reason: debitData.reason });
      alert('Débito realizado com sucesso e resgate registrado!');
      closeModal();
      fetchOngUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Ocorreu um erro ao realizar o débito.';
      alert(`Erro: ${errorMessage}`);
    }
  };

  return (
    <ContentWrapper title="Listar Beneficiários">
      <InputField
        label="Pesquisar por nome, email ou CPF"
        name="search"
        placeholder="Digite para pesquisar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Table 
        headers={headers} 
        data={users} 
        onView={handleViewDetails}
        onEdit={(userToEdit) => openModal('edit', userToEdit)}
        onDelete={(userToDelete) => openModal('delete', userToDelete)}
      />

      {/* --- Modal de Visualização de Detalhes --- */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Detalhes do Beneficiário">
        {loadingDetails ? (
          <p>Carregando detalhes...</p>
        ) : selectedUser ? (
          <div className={styles.modalContent}>
            <h4>Dados do Titular</h4>
            <div className={styles.detailGrid}>
              <p><strong>ID:</strong> {selectedUser.usuario.id}</p>
              <p><strong>Nome:</strong> {selectedUser.usuario.name}</p>
              <p><strong>Email:</strong> {selectedUser.usuario.email || 'N/A'}</p>
              <p><strong>CPF:</strong> {selectedUser.usuario.cpf || 'N/A'}</p>
              <p><strong>Telefone:</strong> {selectedUser.usuario.phone || 'N/A'}</p>
              <p><strong>Saldo de Selos:</strong> {selectedUser.usuario.seal_balance}</p>
              <p><strong>Data de Cadastro:</strong> {formatDate(selectedUser.usuario.created_at)}</p>
            </div>
            <hr className={styles.divider} />
            <h4>Dependentes</h4>
            {selectedUser.dependentes.length > 0 ? (
              // ++ INÍCIO DA CORREÇÃO: Adicionado container para scroll ++
              <div className={styles.dependentsContainer}>
                <table className={styles.dependentsTable}>
                  <thead><tr><th>Nome</th><th>Parentesco</th><th>Data de Nascimento</th></tr></thead>
                  <tbody>
                    {selectedUser.dependentes.map(dep => (
                      <tr key={dep.id}>
                        <td>{dep.full_name}</td>
                        <td>{dep.relationship}</td>
                        {/* A função formatDate corrigida é usada aqui */}
                        <td>{formatDate(dep.birth_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              // ++ FIM DA CORREÇÃO ++
            ) : (
              <p>Nenhum dependente cadastrado.</p>
            )}
            <div className={styles.modalActions}>
              <Button onClick={closeModal} variant="secondary">Fechar</Button>
              <Button onClick={() => openModal('debit', selectedUser.usuario)}>Debitar Saldo</Button>
            </div>
          </div>
        ) : (
          <p>Não foi possível carregar os detalhes.</p>
        )}
      </Modal>

      {/* --- Modal de Edição --- */}
      <Modal isOpen={modalType === 'edit'} onClose={closeModal} title="Editar Beneficiário">
        {selectedUser && (
          <form onSubmit={handleUpdate}>
            <InputField label="Nome" name="name" value={selectedUser.name} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} />
            <InputField label="E-mail" name="email" type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} />
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

      {/* --- Modal de Exclusão --- */}
      <Modal isOpen={modalType === 'delete'} onClose={closeModal} title="Confirmar Exclusão">
        {selectedUser && (
          <div className={styles.modalContent}>
            <p>Tem certeza de que deseja excluir o Beneficiário <strong>{selectedUser.name}</strong>?</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* --- Modal de Débito --- */}
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
