// Arquivo: src/pages/ong/ListOngUsersPage/ListOngUsersPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
            <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>Confirmar Débito</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// --- Componente Modal de Presença / Status (Individual) ---
const AttendanceModal = ({ user, onClose, onConfirm }) => {
  const [status, setStatus] = useState(user?.attendance_status || 'active');
  const [message, setMessage] = useState(user?.analysis_message || '');
  
  const analysisDate = new Date().toLocaleDateString('pt-BR');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ userId: user.id, status, message, analysisDate: new Date().toISOString() });
  };

  if (!user) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Registrar Presença / Status">
      <div className={styles.modalContent}>
        <p><strong>Beneficiário:</strong> {user.name}</p>
        <p><strong>Data da Análise:</strong> {analysisDate}</p>
        
        <form onSubmit={handleSubmit} className={styles.attendanceForm}>
          <div className={styles.statusOptions}>
            <label className={`${styles.statusOption} ${status === 'active' ? styles.statusActive : ''}`}>
              <input type="radio" name="status" value="active" checked={status === 'active'} onChange={(e) => setStatus(e.target.value)} />
              <span className={`${styles.statusDot} ${styles.dotGreen}`}></span> Ativo
            </label>
            <label className={`${styles.statusOption} ${status === 'inactive' ? styles.statusInactive : ''}`}>
              <input type="radio" name="status" value="inactive" checked={status === 'inactive'} onChange={(e) => setStatus(e.target.value)} />
              <span className={`${styles.statusDot} ${styles.dotRed}`}></span> Inativo
            </label>
            <label className={`${styles.statusOption} ${status === 'justified' ? styles.statusJustified : ''}`}>
              <input type="radio" name="status" value="justified" checked={status === 'justified'} onChange={(e) => setStatus(e.target.value)} />
              <span className={`${styles.statusDot} ${styles.dotBlue}`}></span> Ausência Justificada
            </label>
          </div>

          <div className={styles.inputGroup}>
            <label>Mensagem / Observação para o Relatório:</label>
            <textarea 
              rows="4" 
              className={styles.textareaField} 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Descreva o motivo da alteração de status..."
              required={status !== 'active'}
            ></textarea>
          </div>

          <div className={styles.modalActions}>
            <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
            <Button type="submit" style={{ backgroundColor: '#991b1b', borderColor: '#991b1b' }}>Salvar Status</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// --- Função Utilitária para Formatar Data/Hora ---
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);
  return correctedDate.toLocaleDateString('pt-BR');
};

// ==================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ==================================================================
const ListOngUsersPage = ({ user, onNavigate }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Estados de Filtro e Ordenação ---
  const [filterSeals, setFilterSeals] = useState('all'); 
  const [sortBy, setSortBy] = useState('name_asc'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- Estados de Modais e Ação em Massa ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [selectedUsersForMassAction, setSelectedUsersForMassAction] = useState([]);
  const [massActionModal, setMassActionModal] = useState({ isOpen: false, status: 'active', message: '' });
  const [isMassUpdating, setIsMassUpdating] = useState(false);

  const headers = [
    { key: 'checkbox', label: '☑' },
    { key: 'id_display', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'cpf', label: 'CPF' },
    { key: 'seal_balance', label: 'Selos' }
  ];

  const fetchOngUsers = useCallback(async () => {
    if (user && user.ong_id) {
      try {
        const response = await api.get(`/ongs/${user.ong_id}/users`);
        setUsers(response.data);
      } catch (error) { console.error("Erro ao buscar usuários da ONG:", error); }
    }
  }, [user]);

  useEffect(() => { fetchOngUsers(); }, [fetchOngUsers]);

  const processedUsers = useMemo(() => {
    let filtered = users.filter(u => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (u.name && u.name.toLowerCase().includes(term)) || 
        (u.email && u.email.toLowerCase().includes(term)) || 
        (u.cpf && u.cpf.includes(term)) || 
        (u.id && u.id.toString() === term);

      const matchesSeals = 
        filterSeals === 'all' ? true : 
        filterSeals === 'with' ? u.seal_balance > 0 : 
        u.seal_balance === 0;

      // CORREÇÃO: Filtrar pela data de alteração do status (last_analysis_date)
      let matchesDate = true;
      const targetDate = u.last_analysis_date || u.created_at;
      if (startDate) matchesDate = matchesDate && new Date(targetDate) >= new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        matchesDate = matchesDate && new Date(targetDate) < end;
      }

      return matchesSearch && matchesSeals && matchesDate;
    });

    // CORREÇÃO: Novas opções de ordenação
    filtered.sort((a, b) => {
      if (sortBy === 'status_active') {
        if (a.attendance_status === 'active' && b.attendance_status !== 'active') return -1;
        if (a.attendance_status !== 'active' && b.attendance_status === 'active') return 1;
      }
      if (sortBy === 'status_inactive') {
        if (a.attendance_status === 'inactive' && b.attendance_status !== 'inactive') return -1;
        if (a.attendance_status !== 'inactive' && b.attendance_status === 'inactive') return 1;
      }
      if (sortBy === 'status_justified') {
        if (a.attendance_status === 'justified' && b.attendance_status !== 'justified') return -1;
        if (a.attendance_status !== 'justified' && b.attendance_status === 'justified') return 1;
      }
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'seals_desc') return (b.seal_balance || 0) - (a.seal_balance || 0);
      if (sortBy === 'seals_asc') return (a.seal_balance || 0) - (b.seal_balance || 0);
      if (sortBy === 'cpf_asc') return (a.cpf || '').localeCompare(b.cpf || '');
      return 0;
    });

    return filtered.map(u => {
      let dotClass = styles.dotGreen; 
      if (u.attendance_status === 'inactive') dotClass = styles.dotRed;
      if (u.attendance_status === 'justified') dotClass = styles.dotBlue;

      return {
        ...u,
        checkbox: (
          <input 
            type="checkbox" 
            className={styles.massCheckbox}
            checked={selectedUsersForMassAction.includes(u.id)}
            onChange={(e) => {
              if(e.target.checked) setSelectedUsersForMassAction(prev => [...prev, u.id]);
              else setSelectedUsersForMassAction(prev => prev.filter(id => id !== u.id));
            }}
          />
        ),
        id_display: (
          <div className={styles.idWithStatus}>
            <span className={`${styles.statusDot} ${dotClass}`} title={`Status: ${u.attendance_status || 'Ativo'}`}></span>
            {u.id}
          </div>
        )
      };
    });

  }, [users, searchTerm, filterSeals, sortBy, startDate, endDate, selectedUsersForMassAction]);

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
        socialProofs: response.data.provas_sociais || response.data.social_proofs || [], 
        status_history: response.data.status_history || [], // NOVO: Histórico de Status
        used_seals: response.data.used_seals || 0,
        total_earned_seals: response.data.total_earned_seals || userToView.seal_balance || 0
      };
      setSelectedUser({ ...userToView, ...detailedUser });
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

  const handleConfirmAttendance = async (attendanceData) => {
    try {
      await api.put(`/users/${attendanceData.userId}/attendance`, attendanceData);
      alert('Presença/Status atualizado com sucesso!');
      closeModal();
      fetchOngUsers();
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === attendanceData.userId ? {
        ...u, 
        attendance_status: attendanceData.status, 
        analysis_message: attendanceData.message,
        last_analysis_date: attendanceData.analysisDate
      } : u));
      closeModal();
    }
  };

  // --- FUNÇÃO PARA AÇÃO EM MASSA (MUDANÇA DE STATUS) ---
  const handleMassStatusUpdate = async (e) => {
    e.preventDefault();
    if (selectedUsersForMassAction.length === 0) return;
    setIsMassUpdating(true);

    try {
      for (const userId of selectedUsersForMassAction) {
        await api.put(`/users/${userId}/attendance`, {
          status: massActionModal.status,
          message: massActionModal.message,
          analysisDate: new Date().toISOString()
        });
      }
      alert(`Status de ${selectedUsersForMassAction.length} beneficiário(s) atualizado com sucesso!`);
      setMassActionModal({ isOpen: false, status: 'active', message: '' });
      setSelectedUsersForMassAction([]);
      fetchOngUsers(); 
    } catch (error) {
      alert("Ocorreu um erro ao atualizar alguns status. Verifique sua conexão.");
    } finally {
      setIsMassUpdating(false);
    }
  };

  return (
    <ContentWrapper title="Listar Beneficiários">
      
      {/* --- BARRA DE FILTROS AVANÇADOS --- */}
      <div className={styles.filterSection}>
        <div className={styles.searchRow}>
          <div style={{ flex: 1 }}>
            <InputField label="Pesquisa Direta" name="search" placeholder="Nome, E-mail, CPF ou ID exato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
             <label className={styles.filterLabel}>Ordenar por</label>
             <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="status_active">🟢 Primeiro Usuários Ativos</option>
                <option value="status_inactive">🔴 Primeiro Usuários Inativos</option>
                <option value="status_justified">🔵 Primeiro Ausência Justificada</option>
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
                <option value="seals_desc">Maior Saldo de Selos</option>
                <option value="seals_asc">Menor Saldo de Selos</option>
                <option value="cpf_asc">CPF Crescente</option>
             </select>
          </div>
          <div className={styles.filterGroup}>
             <label className={styles.filterLabel}>Filtro de Selos</label>
             <select className={styles.filterSelect} value={filterSeals} onChange={(e) => setFilterSeals(e.target.value)}>
                <option value="all">Todos os Beneficiários</option>
                <option value="with">Apenas COM Selos</option>
                <option value="without">Apenas SEM Selos (Zerados)</option>
             </select>
          </div>
        </div>
        
        <div className={styles.dateFiltersRow}>
          <span className={styles.filterLabel}>Filtrar por Data do Status:</span>
          <div className={styles.dateInputs}>
            <input type="date" className={styles.filterSelect} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span>até</span>
            <input type="date" className={styles.filterSelect} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className={styles.resultsCount}>
            Exibindo <strong>{processedUsers.length}</strong> beneficiário(s)
          </div>
        </div>
      </div>

      {/* --- AÇÃO EM MASSA --- */}
      {processedUsers.length > 0 && (
        <div className={styles.massActionBar}>
          <label className={styles.massActionLabel}>
            <input 
              type="checkbox" 
              className={styles.massCheckboxLg}
              checked={selectedUsersForMassAction.length > 0 && selectedUsersForMassAction.length === processedUsers.length}
              onChange={(e) => {
                if (e.target.checked) setSelectedUsersForMassAction(processedUsers.map(u => u.id));
                else setSelectedUsersForMassAction([]);
              }}
            />
            Selecionar Todos da Lista Atual
          </label>
          <Button 
            disabled={selectedUsersForMassAction.length === 0} 
            onClick={() => setMassActionModal({ ...massActionModal, isOpen: true })}
            style={{ backgroundColor: '#991b1b', borderColor: '#991b1b' }}
          >
            ✏️ Alterar Status em Massa ({selectedUsersForMassAction.length})
          </Button>
        </div>
      )}

      <Table 
        headers={headers} 
        data={processedUsers} 
        onView={handleViewDetails}
        onEdit={(userToEdit) => {
          if(onNavigate) onNavigate('edit_user_profile', { targetUserId: userToEdit.id });
        }}
        onDelete={(userToDelete) => openModal('delete', userToDelete)}
      />

      {/* --- MODAL DE VISUALIZAÇÃO DE DETALHES DO DOSSIÊ --- */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Detalhes Completos do Beneficiário">
        {loadingDetails ? (
          <p style={{padding: '20px', color: '#ea580c'}}>Carregando Dossiê...</p>
        ) : selectedUser ? (
          <div className={styles.modalContent}>
            
            <div className={styles.topActionsRow}>
              <div className={styles.topActionsLeft}>
                <div className={styles.sealHighlightBox}>
                  <span className={styles.sealHighlightLabel}>Saldo Atual</span>
                  <span className={styles.sealHighlightValue}>{selectedUser.seal_balance || 0}</span>
                </div>
              </div>
              <div className={styles.topActionsRight}>
                <Button onClick={closeModal} variant="secondary">Fechar</Button>
                <Button onClick={() => openModal('debit', selectedUser)} style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}>💰 Debitar Selos</Button>
              </div>
            </div>

            <div className={`${styles.detailsCard} ${styles.attendanceHighlight}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, border: 'none', padding: 0, color: '#991b1b' }}>Status de Frequência</h4>
                  <p style={{ marginTop: '5px' }}>
                    <strong>Situação Atual: </strong> 
                    {selectedUser.attendance_status === 'inactive' ? <span className={`${styles.badge} ${styles.badgeFalse}`}>Inativo</span> : 
                     selectedUser.attendance_status === 'justified' ? <span className={`${styles.badge} ${styles.badgeBlue}`}>Ausência Justificada</span> : 
                     <span className={`${styles.badge} ${styles.badgeTrue}`}>Ativo</span>}
                  </p>
                  {selectedUser.last_analysis_date && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Última análise: {formatDateOnly(selectedUser.last_analysis_date)}</p>
                  )}
                </div>
                <Button onClick={() => openModal('attendance', selectedUser)} style={{ backgroundColor: '#f97316', borderColor: '#f97316', padding: '8px 12px', fontSize: '0.9rem' }}>
                  📝 Alterar Status Manualmente
                </Button>
              </div>
              {selectedUser.analysis_message && (
                <div className={styles.analysisMessageBlock}>
                  <strong>Observação da Última Análise:</strong>
                  <p>{selectedUser.analysis_message}</p>
                </div>
              )}
            </div>

            {/* TABELA DE HISTÓRICO DE STATUS (NOVO) */}
            <div className={styles.detailsCard}>
              <h4 className={styles.cardTitle}>Histórico de Frequência e Status</h4>
              {selectedUser.status_history && selectedUser.status_history.length > 0 ? (
                <div className={styles.tableResponsive}>
                  <table className={styles.dependentsTable}>
                    <thead><tr><th>Data da Alteração</th><th>Novo Status</th><th>Administrador</th><th>Observação / Motivo</th></tr></thead>
                    <tbody>
                      {selectedUser.status_history.map((sh, idx) => (
                        <tr key={idx}>
                          <td>{formatDateTime(sh.created_at)}</td>
                          <td>
                            <span className={sh.status === 'inactive' ? styles.statusRejectedSm : sh.status === 'justified' ? styles.statusPendingSm : styles.statusApprovedSm}>
                              {sh.status === 'inactive' ? 'Inativo' : sh.status === 'justified' ? 'Justificado' : 'Ativo'}
                            </span>
                          </td>
                          <td><strong>{sh.admin_name || 'Sistema'}</strong></td>
                          <td>{sh.message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={styles.emptyTextSm}>Nenhum histórico de alterações de status encontrado.</p>}
            </div>

            {/* 1. IDENTIFICAÇÃO E DADOS BÁSICOS */}
            <div className={styles.detailsCard}>
              <h4 className={styles.cardTitle}>1. Dados de Identificação Pessoal</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Nome Completo</span><span className={styles.infoValue}>{selectedUser.name || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>CPF</span><span className={styles.infoValue}>{selectedUser.cpf || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Nome da Mãe</span><span className={styles.infoValue}>{selectedUser.mothers_name || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Data de Nascimento</span><span className={styles.infoValue}>{formatDateOnly(selectedUser.birth_date)}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Gênero</span><span className={styles.infoValue}>{selectedUser.gender || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Orientação Sexual</span><span className={styles.infoValue}>{selectedUser.sexual_orientation || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Telefone/WhatsApp</span><span className={styles.infoValue}>{selectedUser.phone || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>E-mail de Acesso</span><span className={styles.infoValue}>{selectedUser.email || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Data de Cadastro</span><span className={styles.infoValue}>{formatDateOnly(selectedUser.created_at)}</span></div>
              </div>
            </div>

            {/* 2. LOCALIZAÇÃO E HABITAÇÃO */}
            <div className={styles.detailsCard}>
              <h4 className={styles.cardTitle}>2. Localização e Tipo de Habitação</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>CEP</span><span className={styles.infoValue}>{selectedUser.cep || 'N/A'}</span></div>
                <div className={styles.infoBlock} style={{gridColumn: 'span 2'}}><span className={styles.infoLabel}>Endereço</span><span className={styles.infoValue}>{`${selectedUser.logradouro || 'N/A'}, ${selectedUser.numero || 'SN'}`}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Complemento</span><span className={styles.infoValue}>{selectedUser.complemento || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Bairro</span><span className={styles.infoValue}>{selectedUser.bairro || 'N/A'}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Cidade</span><span className={styles.infoValue}>{`${selectedUser.cidade || 'N/A'} - ${selectedUser.estado || 'N/A'}`}</span></div>
                <div className={styles.infoBlock}><span className={styles.infoLabel}>Tempo de Residência</span><span className={styles.infoValue}>{selectedUser.residence_time || 'N/A'}</span></div>
                <div className={styles.infoBlock} style={{gridColumn: 'span 2'}}><span className={styles.infoLabel}>Tipo de Habitação</span><span className={styles.infoValue}>{selectedUser.housing_type || 'N/A'}</span></div>
              </div>
            </div>

            {/* DEPENDENTES DA FAMÍLIA */}
            <div className={styles.detailsCard}>
              <h4 className={styles.cardTitle}>Dependentes da Família</h4>
              {selectedUser.dependents && selectedUser.dependents.length > 0 ? (
               <div className={styles.tableResponsive}>
                <table className={styles.dependentsTable}>
                 <thead><tr><th>Nome Completo</th><th>Parentesco</th><th>Data Nascimento</th><th>CPF (Opcional)</th></tr></thead>
                 <tbody>
                  {selectedUser.dependents.map(dep => (
                   <tr key={dep.id}>
                    <td>{dep.full_name || dep.name}</td>
                    <td>{dep.kinship || dep.relationship}</td>
                    <td>{formatDateOnly(dep.birth_date)}</td>
                    <td>{dep.cpf || 'SN'}</td>
                   </tr>
                  ))}
                 </tbody>
                </table>
               </div>
              ) : (
               <p className={styles.emptyTextSm}>Nenhum dependente cadastrado.</p>
              )}
            </div>

            {/* RESUMO FINANCEIRO (FUNDO DO RELATÓRIO) */}
            <div className={styles.sealSummaryBlock}>
               <h4 style={{width: '100%', margin: '0 0 10px 0', textAlign: 'center', color: '#475569', textTransform: 'uppercase', fontSize: '0.95rem'}}>Resumo Histórico de Selos</h4>
               <div className={styles.sealSummaryContent}>
                 <div className={styles.sealSummaryItem}>
                    <span className={styles.sealSummaryLabel}>Total Adquirido (Histórico)</span>
                    <span className={`${styles.sealSummaryValue} ${styles.valOrange}`}>{selectedUser.total_earned_seals || selectedUser.seal_balance || 0}</span>
                 </div>
                 <div className={styles.sealSummaryItem}>
                    <span className={styles.sealSummaryLabel}>Selos Usados (Resgates)</span>
                    <span className={`${styles.sealSummaryValue} ${styles.valRed}`}>{selectedUser.used_seals || 0}</span>
                 </div>
                 <div className={styles.sealSummaryItem}>
                    <span className={styles.sealSummaryLabel}>Selos Atuais (Saldo)</span>
                    <span className={`${styles.sealSummaryValue} ${styles.valGreen}`}>{selectedUser.seal_balance || 0}</span>
                 </div>
               </div>
            </div>

          </div>
        ) : (
          <p>Não foi possível carregar os detalhes.</p>
        )}
      </Modal>

      {/* --- MODAL AÇÃO EM MASSA (MUDANÇA DE STATUS) --- */}
      <Modal isOpen={massActionModal.isOpen} onClose={() => setMassActionModal({ isOpen: false, status: 'active', message: '' })} title="Alterar Status em Massa">
        <div className={styles.modalContent} style={{ paddingRight: '0' }}>
          <p className={styles.massActionInstruction}>
            Você está a alterar o status de <strong>{selectedUsersForMassAction.length} beneficiário(s)</strong> ao mesmo tempo.
          </p>
          <form onSubmit={handleMassStatusUpdate}>
            <div className={styles.statusOptions} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <label className={styles.statusOption}>
                <input type="radio" name="status" value="active" checked={massActionModal.status === 'active'} onChange={(e) => setMassActionModal({...massActionModal, status: e.target.value})} /> Ativo
              </label>
              <label className={styles.statusOption}>
                <input type="radio" name="status" value="inactive" checked={massActionModal.status === 'inactive'} onChange={(e) => setMassActionModal({...massActionModal, status: e.target.value})} /> Inativo
              </label>
              <label className={styles.statusOption}>
                <input type="radio" name="status" value="justified" checked={massActionModal.status === 'justified'} onChange={(e) => setMassActionModal({...massActionModal, status: e.target.value})} /> Justificada
              </label>
            </div>
            <div className={styles.inputGroup}>
              <label>Motivo da Alteração em Massa *</label>
              <textarea 
                rows="3" className={styles.textareaField} 
                required value={massActionModal.message} 
                onChange={(e) => setMassActionModal({...massActionModal, message: e.target.value})} 
                placeholder="Descreva o motivo (Ex: Reunião de presença de Março...)"
              ></textarea>
            </div>
            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setMassActionModal({ isOpen: false, status: 'active', message: '' })}>Cancelar</Button>
              <Button type="submit" disabled={isMassUpdating} style={{ backgroundColor: '#991b1b', borderColor: '#991b1b' }}>
                {isMassUpdating ? 'A Salvar...' : 'Confirmar Alteração'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Outros Modais */}
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
      
      {modalType === 'debit' && selectedUser && (
        <DebitModal user={selectedUser} onClose={() => openModal('view', selectedUser)} onConfirm={handleConfirmDebit} />
      )}

      {modalType === 'attendance' && selectedUser && (
        <AttendanceModal user={selectedUser} onClose={() => openModal('view', selectedUser)} onConfirm={handleConfirmAttendance} />
      )}

    </ContentWrapper>
  );
};

export default ListOngUsersPage;