// Arquivo: pages/ListOngUsersPage/ListOngUsersPage.jsx (VERSÃO FINAL E COMPLETA)

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListOngUsersPage.module.css';
import { validatePassword } from '../../../utils/validators';
import Icon from '../../../components/ui/Icon/Icon'; // Importação do componente de ícone

// ==================================================================
// COMPONENTES INTERNOS (MODAIS)
// ==================================================================

// --- Modal de Débito ---
const DebitModal = ({ user, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(''); // O motivo é útil para referência futura

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Por favor, insira um valor de débito válido.");
      return;
    }
    // Passa os dados para a função de confirmação
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
            label="Motivo do Débito (Opcional)" 
            placeholder="Ex: Resgate de cesta básica"
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
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

// --- Função Utilitária para Formatar Data ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  // Adiciona 1 dia para corrigir problemas de fuso horário que podem fazer a data "voltar" um dia
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString('pt-BR');
};


// ==================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ==================================================================
const ListOngUsersPage = ({ user }) => {
  // --- Estados ---
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // Armazena os dados para os modais
  const [modalType, setModalType] = useState(null); // Controla qual modal está aberto
  const [loadingDetails, setLoadingDetails] = useState(false); // Loading para o modal de detalhes
  
  // Estados para o modal de edição de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  // --- Cabeçalhos da Tabela ---
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'cpf', label: 'CPF' },
    { key: 'seal_balance', label: 'Selos' }
  ];

  // --- Funções de Busca de Dados ---
  const fetchOngUsers = useCallback(async () => {
    if (user && user.ong_id) {
      try {
        const response = await api.get(`/ongs/${user.ong_id}/users`, { params: { search: searchTerm } });
        setUsers(response.data);
      } catch (error) { console.error("Erro ao buscar usuários da ONG:", error); }
    }
  }, [user, searchTerm]);

  useEffect(() => { fetchOngUsers(); }, [fetchOngUsers]);

  // --- Funções de Manipulação dos Modais ---
  const openModal = (type, userToOpen) => {
    setModalType(type);
    setSelectedUser(userToOpen); // Armazena o usuário da linha clicada
    // Limpa estados específicos ao abrir o modal de edição
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

  // --- Funções de Ação (Handlers) ---

  // NOVO: Busca detalhes completos para o modal de visualização
  const handleViewDetails = async (userToView) => {
    setModalType('view');
    setLoadingDetails(true);
    try {
      const response = await api.get(`/users/${userToView.id}/details`);
      setSelectedUser(response.data); // Armazena o objeto com 'usuario' e 'dependentes'
    } catch (error) {
      console.error("Erro ao buscar detalhes do usuário:", error);
      alert("Não foi possível carregar os detalhes do usuário.");
      setSelectedUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ATUALIZADO: Lida com a atualização de dados e senha
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

  // Lida com a confirmação de exclusão
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

  // Lida com a confirmação do débito e registro do resgate
  const handleConfirmDebit = async (debitData) => {
    try {
      await api.post(`/users/${debitData.userId}/debit-seals`, { amount: debitData.amount });
      alert('Débito realizado com sucesso e resgate registrado!');
      closeModal();
      fetchOngUsers(); // Recarrega a lista para mostrar o novo saldo
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Ocorreu um erro ao realizar o débito.';
      alert(`Erro: ${errorMessage}`);
    }
  };

  // --- Renderização do Componente ---
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
        onView={handleViewDetails} // Ação de visualizar detalhes
        onEdit={(userToEdit) => openModal('edit', userToEdit)} // Ação de editar
        onDelete={(userToDelete) => openModal('delete', userToDelete)} // Ação de excluir
      />

      {/* ================================================================== */}
      {/* SEÇÃO DE MODAIS */}
      {/* ================================================================== */}

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
              <p><strong>Email:</strong> {selectedUser.usuario.email}</p>
              <p><strong>CPF:</strong> {selectedUser.usuario.cpf}</p>
              <p><strong>Telefone:</strong> {selectedUser.usuario.phone || 'N/A'}</p>
              <p><strong>Saldo de Selos:</strong> {selectedUser.usuario.seal_balance}</p>
              <p><strong>Data de Cadastro:</strong> {formatDate(selectedUser.usuario.created_at)}</p>
            </div>
            <hr className={styles.divider} />
            <h4>Dependentes</h4>
            {selectedUser.dependentes.length > 0 ? (
              <div className={styles.dependentsTableContainer}>
                <table className={styles.dependentsTable}>
                  <thead><tr><th>Nome</th><th>Parentesco</th><th>Data de Nascimento</th></tr></thead>
                  <tbody>
                    {selectedUser.dependentes.map(dep => (
                      <tr key={dep.id}>
                        <td>{dep.full_name}</td>
                        <td>{dep.relationship}</td>
                        <td>{formatDate(dep.birth_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            <p>Tem a certeza de que deseja excluir o Beneficiário <strong>{selectedUser.name}</strong>?</p>
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
