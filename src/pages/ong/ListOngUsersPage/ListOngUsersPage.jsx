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

// --- Componente Modal de Presença / Status ---
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
              placeholder="Descreva o motivo da ausência, comportamento ou observação sobre o beneficiário..."
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
  
  // --- Estados de Filtro e Ordenação ---
  const [filterSeals, setFilterSeals] = useState('all'); 
  const [sortBy, setSortBy] = useState('name_asc'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- Estados de Modais ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const headers = [
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

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && new Date(u.created_at) >= new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        matchesDate = matchesDate && new Date(u.created_at) < end;
      }

      return matchesSearch && matchesSeals && matchesDate;
    });

    filtered.sort((a, b) => {
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
        id_display: (
          <div className={styles.idWithStatus}>
            <span className={`${styles.statusDot} ${dotClass}`} title={`Status: ${u.attendance_status || 'Ativo'}`}></span>
            {u.id}
          </div>
        )
      };
    });

  }, [users, searchTerm, filterSeals, sortBy, startDate, endDate]);

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
        used_seals: response.data.used_seals || 0, // Campo esperado do backend para o log
        total_earned_seals: response.data.total_earned_seals || 0 // Campo esperado do backend
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
      alert('Status atualizado visualmente (Backend precisa da rota API /attendance configurada).');
      closeModal();
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
          <span className={styles.filterLabel}>Filtrar por Data de Cadastro:</span>
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

      <Table 
        headers={headers} 
        data={processedUsers} 
        onView={handleViewDetails}
        onEdit={(userToEdit) => {
          if(onNavigate) onNavigate('edit_user_profile', { targetUserId: userToEdit.id });
        }}
        onDelete={(userToDelete) => openModal('delete', userToDelete)}
      />

      {/* --- MODAL DE VISUALIZAÇÃO DE DETALHES --- */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Detalhes Completos do Beneficiário">
        {loadingDetails ? (
          <p style={{padding: '20px', color: '#ea580c'}}>Carregando Mapeamento Social...</p>
        ) : selectedUser ? (
          <div className={styles.modalContent}>
            
            {/* AÇÕES DE TOPO: Fechar e Debitar */}
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

            {/* GESTÃO DE PRESENÇA */}
            <div className={`${styles.detailsBlock} ${styles.attendanceHighlight}`}>
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
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Última análise: {formatDate(selectedUser.last_analysis_date)}</p>
                  )}
                </div>
                <Button onClick={() => openModal('attendance', selectedUser)} style={{ backgroundColor: '#f97316', borderColor: '#f97316', padding: '8px 12px', fontSize: '0.9rem' }}>
                  📝 Alterar Status
                </Button>
              </div>
              {selectedUser.analysis_message && (
                <div className={styles.analysisMessageBlock}>
                  <strong>Observação da Análise:</strong>
                  <p>{selectedUser.analysis_message}</p>
                </div>
              )}
            </div>

            {/* 1. IDENTIFICAÇÃO E DADOS BÁSICOS */}
            <h4>1. Dados de Identificação Pessoal</h4>
            <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
              <div className={styles.infoField}><span className={styles.infoLabel}>Nome Completo</span><span className={styles.infoValue}>{selectedUser.name || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>CPF</span><span className={styles.infoValue}>{selectedUser.cpf || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Nome da Mãe</span><span className={styles.infoValue}>{selectedUser.mothers_name || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Data de Nascimento</span><span className={styles.infoValue}>{formatDate(selectedUser.birth_date)}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Gênero</span><span className={styles.infoValue}>{selectedUser.gender || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Orientação Sexual</span><span className={styles.infoValue}>{selectedUser.sexual_orientation || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Telefone/WhatsApp</span><span className={styles.infoValue}>{selectedUser.phone || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>E-mail de Acesso</span><span className={styles.infoValue}>{selectedUser.email || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Data de Cadastro</span><span className={styles.infoValue}>{formatDate(selectedUser.created_at)}</span></div>
            </div>

            {/* 2. LOCALIZAÇÃO E HABITAÇÃO */}
            <h4>2. Localização e Tipo de Habitação</h4>
            <div className={`${styles.detailsBlock} ${styles.detailsGrid3}`}>
              <div className={styles.infoField}><span className={styles.infoLabel}>CEP</span><span className={styles.infoValue}>{selectedUser.cep || 'N/A'}</span></div>
              <div className={styles.infoField} style={{gridColumn: 'span 2'}}><span className={styles.infoLabel}>Endereço</span><span className={styles.infoValue}>{`${selectedUser.logradouro || 'N/A'}, ${selectedUser.numero || 'SN'}`}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Complemento</span><span className={styles.infoValue}>{selectedUser.complemento || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Bairro</span><span className={styles.infoValue}>{selectedUser.bairro || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Cidade</span><span className={styles.infoValue}>{`${selectedUser.cidade || 'N/A'} - ${selectedUser.estado || 'N/A'}`}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Tempo de Residência</span><span className={styles.infoValue}>{selectedUser.residence_time || 'N/A'}</span></div>
              <div className={styles.infoField} style={{gridColumn: 'span 2'}}><span className={styles.infoLabel}>Tipo de Habitação</span><span className={styles.infoValue}>{selectedUser.housing_type || 'N/A'}</span></div>
            </div>

            {/* 3. CONDIÇÕES DE MORADIA */}
            <h4>3. Condições de Moradia</h4>
            <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
              <div className={styles.infoField}><span className={styles.infoLabel}>Número de Cômodos na Casa</span><span className={styles.infoValue}>{selectedUser.rooms_count || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Água Encanada?</span><span className={styles.infoValue}>{selectedUser.has_water ? <span className={`${styles.badge} ${styles.badgeTrue}`}>Sim</span> : <span className={`${styles.badge} ${styles.badgeFalse}`}>Não</span>}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Saneamento/Esgoto?</span><span className={styles.infoValue}>{selectedUser.has_sanitation ? <span className={`${styles.badge} ${styles.badgeTrue}`}>Sim</span> : <span className={`${styles.badge} ${styles.badgeFalse}`}>Não</span>}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Energia Elétrica Regular?</span><span className={styles.infoValue}>{selectedUser.has_electricity ? <span className={`${styles.badge} ${styles.badgeTrue}`}>Sim</span> : <span className={`${styles.badge} ${styles.badgeFalse}`}>Não</span>}</span></div>
            </div>

            {/* 4. COMPOSIÇÃO FAMILIAR E SOCIOECONÔMICA */}
            <h4>4. Composição Familiar e Socioeconômica</h4>
            <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
              <div className={styles.infoField}><span className={styles.infoLabel}>Renda Familiar Total Estimada</span><span className={styles.infoValue}>{selectedUser.family_income ? `R$ ${selectedUser.family_income}` : 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Total de Pessoas (Moradores)</span><span className={styles.infoValue}>{selectedUser.household_size || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Escolaridade do Titular</span><span className={styles.infoValue}>{selectedUser.education_level || 'N/A'}</span></div>
              <div className={styles.infoField}><span className={styles.infoLabel}>Situação de Trabalho do Titular</span><span className={styles.infoValue}>{selectedUser.employment_status || 'N/A'}</span></div>
            </div>
            
            {/* Benefícios Sociais */}
            <div className={styles.detailsBlock}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Recebe benefícios sociais?</span>
                <span className={styles.infoValue}>
                  {selectedUser.social_benefits && selectedUser.social_benefits.length > 0 ? (
                    <div className={styles.pillsContainer}>
                      {selectedUser.social_benefits.map(benefit => <span key={benefit} className={styles.pillItem}>{benefit}</span>)}
                    </div>
                  ) : <span style={{color: '#666'}}>Nenhum benefício informado.</span>}
                </span>
              </div>
            </div>

            {/* 5. MAPEAMENTO COMUNITÁRIO E NECESSIDADES */}
            <h4>5. Perfil Comunitário e Necessidades</h4>
            <div className={`${styles.detailsBlock} ${styles.detailsGrid2}`}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Acesso a Serviços Públicos</span>
                <span className={styles.infoValue}>
                  {selectedUser.public_services_access && selectedUser.public_services_access.length > 0 ? (
                    <div className={styles.pillsContainer}>
                      {selectedUser.public_services_access.map(service => <span key={service} className={styles.pillItem}>{service}</span>)}
                    </div>
                  ) : <span style={{color: '#666'}}>Nenhum acesso informado.</span>}
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Maiores Necessidades da Família</span>
                <span className={styles.infoValue}>
                  {selectedUser.main_needs && selectedUser.main_needs.length > 0 ? (
                    <div className={styles.pillsContainer}>
                      {selectedUser.main_needs.map(need => <span key={need} className={styles.pillItem}>{need}</span>)}
                    </div>
                  ) : <span style={{color: '#666'}}>Nenhuma necessidade informada.</span>}
                </span>
              </div>

              <div className={styles.infoField} style={{gridColumn: 'span 2'}}>
                <span className={styles.infoLabel}>Pertence a Povos/Comunidades Tradicionais?</span>
                <span className={styles.infoValue}>{selectedUser.traditional_community || 'Não'}</span>
              </div>
            </div>

            <hr className={styles.divider} />
            
            <h4>Dependentes da Família</h4>
            {selectedUser.dependents && selectedUser.dependents.length > 0 ? (
             <div className={styles.dependentsContainer}>
              <table className={styles.dependentsTable}>
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
            
            <h4>Provas Sociais Pendentes</h4>
            {selectedUser.socialProofs && selectedUser.socialProofs.length > 0 ? (
             <div className={styles.socialProofsContainer}>
              <table className={styles.dependentsTable}>
               <thead><tr><th>Tipo / Título</th><th>Data de Envio</th><th>Status</th></tr></thead>
               <tbody>
                {selectedUser.socialProofs
                  .filter(proof => proof.status === 'pendente' || proof.status === 'pending')
                  .map(proof => (
                 <tr key={proof.id}>
                  <td>{proof.title || proof.type || 'Documento'}</td>
                  <td>{formatDate(proof.created_at)}</td>
                  <td><span style={{ color: '#ea580c', fontWeight: 'bold' }}>Pendente</span></td>
                 </tr>
                ))}
               </tbody>
              </table>
             </div>
            ) : (
             <p style={{ color: '#666', paddingLeft: '15px' }}>Nenhuma prova social pendente.</p>
            )}

            <hr className={styles.divider} />

            {/* LOG FINANCEIRO DE SELOS (NO FUNDO DO RELATÓRIO) */}
            <h4>Resumo Histórico de Selos</h4>
            <div className={styles.sealSummaryBlock}>
               <div className={styles.sealSummaryItem}>
                  <span className={styles.sealSummaryLabel}>Selos Usados (Resgates)</span>
                  <span className={`${styles.sealSummaryValue} ${styles.valRed}`}>{selectedUser.used_seals || 0}</span>
               </div>
               <div className={styles.sealSummaryItem}>
                  <span className={styles.sealSummaryLabel}>Selos Atuais (Saldo)</span>
                  <span className={`${styles.sealSummaryValue} ${styles.valGreen}`}>{selectedUser.seal_balance || 0}</span>
               </div>
               <div className={styles.sealSummaryItem}>
                  <span className={styles.sealSummaryLabel}>Total Adquirido (Histórico)</span>
                  <span className={`${styles.sealSummaryValue} ${styles.valOrange}`}>{selectedUser.total_earned_seals || selectedUser.seal_balance || 0}</span>
               </div>
            </div>

          </div>
        ) : (
          <p>Não foi possível carregar os detalhes.</p>
        )}
      </Modal>

      {/* --- Modal de Exclusão e Modal de Débito/Attendance --- */}
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