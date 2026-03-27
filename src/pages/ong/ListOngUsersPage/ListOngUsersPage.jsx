// Arquivo: src/pages/ong/ListOngUsersPage/ListOngUsersPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
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
const ListOngUsersPage = ({ user, onNavigate }) => {
 const [users, setUsers] = useState([]);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedUser, setSelectedUser] = useState(null);
 const [modalType, setModalType] = useState(null);
 const [loadingDetails, setLoadingDetails] = useState(false);

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
        // Mapeando provas sociais
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
    // CORREÇÃO: Usa o nosso onNavigate passando o ID do usuário que queremos editar
    onEdit={(userToEdit) => {
      if(onNavigate) {
        onNavigate('edit_user_profile', { targetUserId: userToEdit.id });
      } else {
        console.error("onNavigate não foi passado para ListOngUsersPage");
      }
    }}
    onDelete={(userToDelete) => openModal('delete', userToDelete)}
   />

   {/* --- Modal de Visualização de Detalhes --- */}
   <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Detalhes Completos do Beneficiário">
    {loadingDetails ? (
     <p style={{padding: '20px'}}>Carregando Mapeamento Social...</p>
    ) : selectedUser ? (
     <div className={styles.modalContent}>
      
      {/* 1. IDENTIFICAÇÃO E DADOS BÁSICOS */}
      <h4>1. Dados de Identificação Pessoal</h4>
      <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
        <p><strong>Nome Completo:</strong> {selectedUser.name}</p>
        <p><strong>CPF:</strong> {selectedUser.cpf || 'N/A'}</p>
        <p><strong>Nome da Mãe:</strong> {selectedUser.mothers_name || 'N/A'}</p>
        <p><strong>Data de Nascimento:</strong> {formatDate(selectedUser.birth_date)}</p>
        <p><strong>Gênero:</strong> {selectedUser.gender || 'N/A'}</p>
        <p><strong>Orientação Sexual:</strong> {selectedUser.sexual_orientation || 'N/A'}</p>
        <p><strong>Telefone/WhatsApp:</strong> {selectedUser.phone || 'N/A'}</p>
        <p><strong>E-mail de Acesso:</strong> {selectedUser.email || 'N/A'}</p>
        <p><strong>Data de Cadastro no Sistema:</strong> {formatDate(selectedUser.created_at)}</p>
        <p><strong>Saldo Atual de Selos:</strong> {selectedUser.seal_balance}</p>
      </div>

      {/* 2. LOCALIZAÇÃO E HABITAÇÃO */}
      <h4>2. Localização e Tipo de Habitação</h4>
      <div className={`${styles.detailsBlock} ${styles.detailsGrid3}`}>
        <p><strong>CEP:</strong> {selectedUser.cep || 'N/A'}</p>
        <p style={{gridColumn: 'span 2'}}><strong>Endereço:</strong> {`${selectedUser.logradouro || 'N/A'}, ${selectedUser.numero || 'SN'}`}</p>
        <p><strong>Complemento:</strong> {selectedUser.complemento || 'N/A'}</p>
        <p><strong>Bairro:</strong> {selectedUser.bairro || 'N/A'}</p>
        <p><strong>Cidade:</strong> {`${selectedUser.cidade || 'N/A'} - ${selectedUser.estado || 'N/A'}`}</p>
        <p><strong>Tempo de Residência no Local:</strong> {selectedUser.residence_time || 'N/A'}</p>
        <p style={{gridColumn: 'span 2'}}><strong>Tipo de Habitação:</strong> {selectedUser.housing_type || 'N/A'}</p>
      </div>

      {/* 3. CONDIÇÕES DE MORADIA */}
      <h4>3. Condições de Moradia</h4>
      <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
        <p><strong>Número de Cômodos na Casa:</strong> {selectedUser.rooms_count || 'N/A'}</p>
        <p style={{display: 'flex', gap: '10px'}}><strong>Água Encanada?</strong> {selectedUser.has_water ? <span className={`${styles.badge} ${styles.badgeTrue}`}>Sim</span> : <span className={`${styles.badge} ${styles.badgeFalse}`}>Não</span>}</p>
        <p style={{display: 'flex', gap: '10px'}}><strong>Saneamento/Esgoto?</strong> {selectedUser.has_sanitation ? <span className={`${styles.badge} ${styles.badgeTrue}`}>Sim</span> : <span className={`${styles.badge} ${styles.badgeFalse}`}>Não</span>}</p>
        <p style={{display: 'flex', gap: '10px'}}><strong>Energia Elétrica Regular?</strong> {selectedUser.has_electricity ? <span className={`${styles.badge} ${styles.badgeTrue}`}>Sim</span> : <span className={`${styles.badge} ${styles.badgeFalse}`}>Não</span>}</p>
      </div>

      {/* 4. COMPOSIÇÃO FAMILIAR E SOCIOECONÔMICA */}
      <h4>4. Composição Familiar e Socioeconômica</h4>
      <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
        <p><strong>Renda Familiar Total Estimada:</strong> {selectedUser.family_income ? `R$ ${selectedUser.family_income}` : 'N/A'}</p>
        <p><strong>Total de Pessoas que Moram na Casa:</strong> {selectedUser.household_size || 'N/A'}</p>
        <p><strong>Escolaridade do Titular:</strong> {selectedUser.education_level || 'N/A'}</p>
        <p><strong>Situação de Trabalho do Titular:</strong> {selectedUser.employment_status || 'N/A'}</p>
      </div>
      
      {/* Benefícios Sociais (Listagem dinânica de JSON) */}
      <div className={styles.detailsBlock}>
        <p><strong>Recebe benefícios sociais?</strong></p>
        {selectedUser.social_benefits && selectedUser.social_benefits.length > 0 ? (
          <div className={styles.pillsContainer}>
            {selectedUser.social_benefits.map(benefit => <span key={benefit} className={styles.pillItem}>{benefit}</span>)}
          </div>
        ) : <p style={{color: '#666'}}>Nenhum benefício informado.</p>}
      </div>

      {/* 5. MAPEAMENTO COMUNITÁRIO E NECESSIDADES */}
      <h4>5. Perfil Comunitário e Necessidades</h4>
      <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
        <p><strong>Acesso a Serviços Públicos:</strong></p>
        {selectedUser.public_services_access && selectedUser.public_services_access.length > 0 ? (
          <div className={styles.pillsContainer}>
            {selectedUser.public_services_access.map(service => <span key={service} className={styles.pillItem}>{service}</span>)}
          </div>
        ) : <p style={{color: '#666'}}>Nenhum acesso informado.</p>}

        <p><strong>Maiores Necessidades da Família:</strong></p>
        {selectedUser.main_needs && selectedUser.main_needs.length > 0 ? (
          <div className={styles.pillsContainer}>
            {selectedUser.main_needs.map(need => <span key={need} className={styles.pillItem}>{need}</span>)}
          </div>
        ) : <p style={{color: '#666'}}>Nenhuma necessidade informada.</p>}

        <p style={{gridColumn: 'span 2'}}><strong>Pertence a Povos/Comunidades Tradicionais?</strong> {selectedUser.traditional_community || 'Não'}</p>
      </div>

      <hr className={styles.divider} />
      
      <h4>Dependentes da Família</h4>
      {selectedUser.dependents && selectedUser.dependents.length > 0 ? (
       <div className={styles.dependentsContainer}>
        <table className={styles.dependentsTable} style={{ width: '100%', textAlign: 'left' }}>
         <thead><tr><th>Nome Completo</th><th>Parentesco</th><th>Data Nascimento</th><th>CPF (Opcional)</th></tr></thead>
         <tbody>
          {selectedUser.dependents.map(dep => (
           <tr key={dep.id}>
            <td>{dep.full_name || dep.name}</td>
            <td>{dep.kinship || dep.relationship}</td>
            <td>{formatDate(dep.birth_date)}</td>
            <td>{dep.cpf || 'SN'}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ) : (
       <p style={{ color: '#666', paddingLeft: '15px' }}>Nenhum dependente cadastrado.</p>
      )}

      <hr className={styles.divider} />
      
      {/* Opcional: Provas Sociais Pendentes */}
      <h4>Provas Sociais Pendentes</h4>
      {selectedUser.socialProofs && selectedUser.socialProofs.length > 0 ? (
       <div className={styles.socialProofsContainer}>
        <table className={styles.dependentsTable} style={{ width: '100%', textAlign: 'left' }}>
         <thead><tr><th>Tipo / Título</th><th>Data de Envio</th><th>Status</th></tr></thead>
         <tbody>
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
       <p style={{ color: '#666', paddingLeft: '15px' }}>Nenhuma prova social pendente.</p>
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