// Arquivo: pages/ong/ListOngUsersPage/ListOngUsersPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Adicionado hook de navegação
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListOngUsersPage.module.css';

// --- Componente Modal de Débito ---
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

// --- Função Utilitária para Formatar Data ---
const formatDate = (dateString) => {
 if (!dateString) return 'N/A';
 const date = new Date(dateString);
 if (isNaN(date.getTime())) return 'Data Inválida';
 date.setDate(date.getDate() + 1);
 return date.toLocaleDateString('pt-BR');
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
 
 const navigate = useNavigate(); // Instanciando a navegação

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
      const detailedUser = {
        ...response.data.usuario,
        dependents: response.data.dependentes || [],
        // Mapeando provas sociais. Ajuste 'provas_sociais' conforme vem da sua API
        socialProofs: response.data.provas_sociais || response.data.social_proofs || [], 
      };
      setSelectedUser(detailedUser);
  } catch (error) {
   console.error("Erro ao buscar detalhes do usuário:", error);
   alert("Não foi possível carregar os detalhes do usuário.");
   setSelectedUser(null);
  } finally {
   setLoadingDetails(false);
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
    
    {/* NOVO: Bloco de Convite */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div>
        <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>Convide novas famílias</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Envie o link abaixo para que as famílias se cadastrem automaticamente na sua OSC.</p>
      </div>
      <Button 
        onClick={() => {
          const inviteLink = `${window.location.origin}/cadastro?ong=${user.ong_id}`;
          navigator.clipboard.writeText(inviteLink)
            .then(() => alert('✅ Link de convite copiado!\n\nCole no WhatsApp e envie para as famílias.'))
            .catch(() => alert('Erro ao copiar o link.'));
        }}
        style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
      >
        📋 Copiar Link de Convite
      </Button>
    </div>

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
    // Redireciona para a página de edição em vez de abrir modal
    onEdit={(userToEdit) => navigate(`/editar-usuario/${userToEdit.id}`)}
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
       <p><strong>ID:</strong> {selectedUser.id}</p>
       <p><strong>Nome:</strong> {selectedUser.name}</p>
       <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
       <p><strong>CPF:</strong> {selectedUser.cpf || 'N/A'}</p>
       <p><strong>Telefone:</strong> {selectedUser.phone || 'N/A'}</p>
       <p><strong>Saldo de Selos:</strong> {selectedUser.seal_balance}</p>
       <p><strong>Data de Cadastro:</strong> {formatDate(selectedUser.created_at)}</p>
      </div>

      <hr className={styles.divider} />
      
      <h4>Dependentes</h4>
      {selectedUser.dependents && selectedUser.dependents.length > 0 ? (
       <div className={styles.dependentsContainer}>
        <table className={styles.dependentsTable} style={{ width: '100%', textAlign: 'left' }}>
         <thead><tr><th>Nome</th><th>Parentesco</th><th>Data de Nascimento</th></tr></thead>
         <tbody>
          {selectedUser.dependents.map(dep => (
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
       <p style={{ color: '#666' }}>Nenhum dependente cadastrado.</p>
      )}

      <hr className={styles.divider} />
      
      {/* NOVO: Bloco de Provas Sociais Pendentes */}
      <h4>Provas Sociais Pendentes</h4>
      {selectedUser.socialProofs && selectedUser.socialProofs.length > 0 ? (
       <div className={styles.socialProofsContainer}>
        <table className={styles.dependentsTable} style={{ width: '100%', textAlign: 'left' }}>
         <thead>
          <tr>
            <th>Tipo / Título</th>
            <th>Data de Envio</th>
            <th>Status</th>
          </tr>
         </thead>
         <tbody>
          {/* O filtro abaixo garante que apareçam apenas as pendentes, caso a API traga todas */}
          {selectedUser.socialProofs
            .filter(proof => proof.status === 'pendente' || proof.status === 'pending')
            .map(proof => (
           <tr key={proof.id}>
            <td>{proof.title || proof.type || 'Documento'}</td>
            <td>{formatDate(proof.created_at)}</td>
            <td><span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Pendente</span></td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ) : (
       <p style={{ color: '#666' }}>Nenhuma prova social pendente no momento.</p>
      )}

      <div className={styles.modalActions} style={{ marginTop: '20px' }}>
       <Button onClick={closeModal} variant="secondary">Fechar</Button>
       <Button onClick={() => openModal('debit', selectedUser)}>Debitar Saldo</Button>
      </div>
     </div>
    ) : (
     <p>Não foi possível carregar os detalhes.</p>
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