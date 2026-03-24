import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngReportsPage.module.css';

const headerTranslations = {
  id: 'ID', name: 'Nome', cpf: 'CPF', seal_balance: 'Saldo de Selos',
  used_seals: 'Selos Usados', user_id: 'ID do Usuário', user_name: 'Nome do Usuário',
  user_cpf: 'CPF do Usuário', redemption_date: 'Data do Resgate',
  seals_redeemed: 'Selos Resgatados', remaining_balance: 'Saldo Restante',
  dependents_count: 'Dependentes'
};

const translateHeader = (headerKey) => headerTranslations[headerKey] || headerKey;

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatDateOnly = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);
  return correctedDate.toLocaleDateString('pt-BR');
};

const OngReportsPage = ({ currentUser }) => {
  const [reportData, setReportData] = useState(null);
  
  // Estados de Pesquisa
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Modal de Visão 360 do Utilizador
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProofs, setUserProofs] = useState([]);
  const [loadingUserProofs, setLoadingUserProofs] = useState(false);

  // Garante que a ONG só vê os seus próprios dados
  const myOngId = currentUser?.ong_id || currentUser?.id;

  // 1. Carrega Dados Gerais (Estatísticas e Beneficiários vinculados à ONG)
  useEffect(() => {
    if (!myOngId) { setLoading(false); return; }
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = { ongId: myOngId, search: userSearchTerm || undefined };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null);
      } finally { setLoading(false); }
    };
    
    const debounceFetch = setTimeout(() => { fetchReportData(); }, 300);
    return () => clearTimeout(debounceFetch);
  }, [myOngId, userSearchTerm]);

  // 2. Carrega o Histórico de Auditoria (Provas da ONG)
  useEffect(() => {
    if (!myOngId) return;
    const fetchAuditLogs = async () => {
      setLoadingAudit(true);
      try {
        const response = await api.get(`/proofs/log/${myOngId}`);
        setAuditLogs(response.data);
      } catch (error) {
        console.error("Erro ao carregar auditoria:", error);
        setAuditLogs([]);
      } finally { setLoadingAudit(false); }
    };
    fetchAuditLogs();
  }, [myOngId]);

  // ++ FUNÇÃO PARA ABRIR O PERFIL 360 ++
  const handleOpenUserProfile = async (user) => {
    setSelectedUserProfile(user);
    setIsUserProfileOpen(true);
    setLoadingUserProofs(true);
    try {
      // Busca as provas sociais DESTE utilizador específico (filtradas pela API)
      const response = await api.get(`/proofs/user/${user.id}`);
      // Como o endpoint traz todas as provas do user, filtramos no frontend para garantir
      // que a OSC só vê as provas que foram submetidas para a sua ONG
      const ongProofs = response.data.filter(p => p.ong_id === myOngId);
      setUserProofs(ongProofs);
    } catch (error) {
      console.error("Erro ao buscar provas do usuário:", error);
      setUserProofs([]);
    } finally {
      setLoadingUserProofs(false);
    }
  };

  // ++ FUNÇÃO PARA GERAR O DOSSIÊ DO UTILIZADOR ++
  const handleDownloadUserDossier = () => {
    if (!selectedUserProfile) return;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Dossie do Beneficiario: ${selectedUserProfile.name}`, 14, 20);
    
    // Dados Pessoais e Carteira
    autoTable(doc, {
      startY: 28,
      head: [['Dados Pessoais', 'Informação']],
      body: [
        ['CPF', selectedUserProfile.cpf],
        ['E-mail', selectedUserProfile.email || 'Não informado'],
        ['Telefone', selectedUserProfile.phone || 'Não informado'],
        ['Saldo Atual', `${selectedUserProfile.seal_balance} Selos`],
        ['Dependentes', `${selectedUserProfile.dependents_count || 0}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] } // Cor laranja para ONG
    });

    // Provas Sociais
    const proofsBody = userProofs.map(p => [
      p.title,
      formatDateOnly(p.created_at),
      p.status === 'approved' ? 'Aprovada' : p.status === 'rejected' ? 'Rejeitada' : 'Pendente',
      p.evaluator_name || '-',
      p.evaluated_at ? formatDateOnly(p.evaluated_at) : '-'
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Prova Social', 'Envio', 'Status', 'Avaliador', 'Data Avaliação']],
      body: proofsBody.length > 0 ? proofsBody : [['Nenhuma prova enviada para esta OSC', '', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }
    });

    // Histórico de Resgates
    const userRedemptions = data?.allRedemptions ? data.allRedemptions.filter(r => r.user_id === selectedUserProfile.id) : [];
    const redemptionsBody = userRedemptions.map(r => [
      r.prize_name,
      formatDateOnly(r.redemption_date),
      `-${r.seals_redeemed} Selos`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Resgate Realizado', 'Data do Resgate', 'Custo']],
      body: redemptionsBody.length > 0 ? redemptionsBody : [['Nenhum resgate efetuado', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }
    });

    doc.save(`Dossie_${selectedUserProfile.name.replace(/ /g, '_')}.pdf`);
  };

  const data = reportData;

  // Lógica de Ordenação A-Z (Beneficiários)
  const sortedUsers = data?.allUsers 
    ? [...data.allUsers].sort((a, b) => a.name.localeCompare(b.name)) 
    : [];

  // Lógica de Filtragem e Agrupamento A-Z (Auditoria)
  const filteredLogs = auditLogs.filter(log => {
    const term = auditSearchTerm.toLowerCase();
    return (
      (log.sender_name && log.sender_name.toLowerCase().includes(term)) ||
      (log.activity_title && log.activity_title.toLowerCase().includes(term)) ||
      (log.evaluator_name && log.evaluator_name.toLowerCase().includes(term))
    );
  });

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const userName = log.sender_name || 'Utilizador Desconhecido';
    if (!acc[userName]) acc[userName] = [];
    acc[userName].push(log);
    return acc;
  }, {});

  const sortedLogUsers = Object.keys(groupedLogs).sort((a, b) => a.localeCompare(b));

  if (loading && !reportData) {
    return <ContentWrapper title="Meus Relatórios"><p>A carregar relatórios da organização...</p></ContentWrapper>;
  }

  const userRedemptions = selectedUserProfile && data?.allRedemptions 
    ? data.allRedemptions.filter(r => r.user_id === selectedUserProfile.id) 
    : [];

  return (
    <ContentWrapper title="Meus Relatórios">
      
      {data ? (
        <>
          {/* ESTATÍSTICAS GERAIS */}
          <div className={styles.reportBlock}>
            <ReportSection title="Visão Geral da Organização">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}>
                  <p>Beneficiários Cadastrados</p>
                  <span>{data.generalStats?.totalUsers || 0}</span>
                </div>
                <div className={styles.statCard} style={{ backgroundColor: '#d1fae5' }}>
                  <p>Selos Distribuídos/Ativos</p>
                  <span>{data.generalStats?.totalSealsInCirculation || 0}</span>
                </div>
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}>
                  <p>Selos Resgatados</p>
                  <span>{data.generalStats?.totalSealsRedeemed || 0}</span>
                </div>
              </div>
            </ReportSection>
          </div>

          {/* BENEFICIÁRIOS CADASTRADOS (LISTA A-Z CLICÁVEL) */}
          <div className={styles.reportBlock}>
            <ReportSection title="Meus Beneficiários (A-Z)">
              <div className={styles.sectionHeader}>
                <InputField
                  label="Filtrar Beneficiários"
                  placeholder="Nome ou CPF..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              
              <div className={styles.groupedListContainer}>
                {sortedUsers.length > 0 ? sortedUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={styles.userListItemClickable} 
                    onClick={() => handleOpenUserProfile(user)}
                    title="Clique para ver o perfil completo"
                  >
                    <div className={styles.userMainInfo}>
                      <span className={styles.userAvatarSm}>{user.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <h4 className={styles.userNameTitle}>{user.name}</h4>
                        <span className={styles.userSubText}>CPF: {user.cpf}</span>
                      </div>
                    </div>
                    <div className={styles.userStats}>
                      <div className={styles.statPill}>
                        <strong>{user.seal_balance}</strong> Selos
                      </div>
                      <div className={styles.statPillLight}>
                        <strong>{user.dependents_count || (user.dependents ? user.dependents.length : 0)}</strong> Dependentes
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className={styles.emptyMessage}>Nenhum beneficiário encontrado.</p>
                )}
              </div>
            </ReportSection>
          </div>

          {/* HISTÓRICO DE AVALIAÇÕES E ATIVIDADES DA OSC (AGRUPADO A-Z) */}
          <div className={styles.reportBlock}>
            <ReportSection title="Auditoria de Provas Sociais e Atividades (A-Z)">
              <div className={styles.sectionHeader}>
                <InputField
                  label="Filtrar Histórico"
                  placeholder="Pesquisar por nome do beneficiário, atividade ou avaliador..."
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                />
              </div>

              <div className={styles.groupedListContainer}>
                {loadingAudit ? (
                  <p className={styles.loadingText}>A carregar auditoria...</p>
                ) : sortedLogUsers.length > 0 ? (
                  sortedLogUsers.map(userName => (
                    <div key={userName} className={styles.userGroup}>
                      {/* Cabeçalho do Agrupamento */}
                      <div className={styles.userGroupHeader}>
                        <div className={styles.userInfo}>
                          <span className={styles.userAvatarSm}>{userName.charAt(0).toUpperCase()}</span>
                          <h4 className={styles.userNameTitle}>{userName}</h4>
                        </div>
                        <span className={styles.badgeCount}>{groupedLogs[userName].length} registo(s)</span>
                      </div>

                      {/* Lista de Logs */}
                      <div className={styles.logGrid}>
                        {groupedLogs[userName].map(log => (
                          <div key={log.id} className={styles.logCard}>
                            <div className={styles.logHeader}>
                              <h5>{log.activity_title} <span className={styles.sealBadge}>+{log.seal_value} Selos</span></h5>
                            </div>

                            <div className={styles.logBody}>
                              <div className={styles.logRow}>
                                <span><strong>Enviado em:</strong> {formatDateTime(log.sent_at)}</span>
                              </div>
                              <div className={styles.logRow}>
                                <span><strong>Avaliador (Admin OSC):</strong> {log.evaluator_name || 'Automático'}</span>
                                <span><strong>Data Avaliação:</strong> {formatDateTime(log.evaluated_at)}</span>
                              </div>
                            </div>

                            <div className={styles.logFooter}>
                              <span className={log.status === 'approved' ? styles.statusApproved : styles.statusRejected}>
                                {log.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyMessage}>Nenhum registo de avaliação encontrado.</p>
                )}
              </div>
            </ReportSection>
          </div>
        </>
      ) : (
        !loading && <p className={styles.emptyMessage}>Não foi possível carregar os dados da sua organização.</p>
      )}

      {/* MODAL CUSTOMIZADO: VISÃO 360 DO UTILIZADOR */}
      {isUserProfileOpen && selectedUserProfile && (
        <div className={styles.customOverlay} onClick={() => setIsUserProfileOpen(false)}>
          <div className={styles.customModalLg} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.customModalHeader}>
              <div className={styles.modalHeaderTitle}>
                <h3>Perfil Completo do Beneficiário</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsUserProfileOpen(false)}>×</button>
            </div>

            <div className={styles.customModalBody}>
              <div className={styles.profileHeaderCard}>
                <div className={styles.profileHeaderLeft}>
                  <div className={styles.profileAvatarLg}>{selectedUserProfile.name.charAt(0).toUpperCase()}</div>
                  <div className={styles.profileHeaderInfo}>
                    <h2>{selectedUserProfile.name}</h2>
                    <p>Cadastrado no sistema: {formatDateOnly(selectedUserProfile.created_at)}</p>
                  </div>
                </div>
                <button className={styles.downloadBtn} onClick={handleDownloadUserDossier}>
                  📥 Baixar Dossiê PDF
                </button>
              </div>

              <div className={styles.profileGridLg}>
                
                {/* Coluna 1: Dados, Carteira e Dependentes */}
                <div className={styles.profileSideCol}>
                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Dados Pessoais</h4>
                    <ul className={styles.profileDataList}>
                      <li><strong>CPF:</strong> {selectedUserProfile.cpf}</li>
                      <li><strong>E-mail:</strong> {selectedUserProfile.email || 'Não informado'}</li>
                      <li><strong>Telefone:</strong> {selectedUserProfile.phone || 'Não informado'}</li>
                    </ul>
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Carteira Global de Selos</h4>
                    <div className={styles.walletCardsColumn}>
                      <div className={styles.walletCardActive}>
                        <span>Saldo Atual</span>
                        <strong>{selectedUserProfile.seal_balance}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Dependentes ({selectedUserProfile.dependents?.length || 0})</h4>
                    {selectedUserProfile.dependents && selectedUserProfile.dependents.length > 0 ? (
                      <ul className={styles.dependentsList}>
                        {selectedUserProfile.dependents.map((dep, i) => (
                          <li key={i}>
                            <strong>{dep.name}</strong>
                            <span>Nasc: {formatDateOnly(dep.birth_date)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className={styles.emptyTextSm}>Nenhum dependente cadastrado.</p>}
                  </div>
                </div>

                {/* Coluna 2: Provas e Resgates da OSC */}
                <div className={styles.profileMainCol}>
                  
                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Histórico de Provas Sociais na sua OSC ({userProofs.length})</h4>
                    {loadingUserProofs ? (
                      <p className={styles.emptyTextSm}>A carregar provas...</p>
                    ) : userProofs.length > 0 ? (
                      <ul className={styles.historyList}>
                        {userProofs.map(proof => (
                          <li key={proof.id} className={styles.proofHistoryItem}>
                            <div className={styles.historyHeaderRow}>
                              <div className={styles.historyMain}>
                                <strong>{proof.title}</strong>
                                <span className={styles.historyDate}>Enviado: {formatDateTime(proof.created_at)}</span>
                              </div>
                              <span className={
                                proof.status === 'approved' ? styles.statusApprovedSm :
                                proof.status === 'rejected' ? styles.statusRejectedSm :
                                styles.statusPendingSm
                              }>
                                {proof.status === 'approved' ? 'Aprovada' : proof.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                              </span>
                            </div>
                            
                            {proof.status !== 'pending' && (
                              <div className={styles.proofEvalInfo}>
                                <span><strong>Avaliador:</strong> {proof.evaluator_name || 'Desconhecido'}</span>
                                <span><strong>Data:</strong> {formatDateTime(proof.evaluated_at)}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : <p className={styles.emptyTextSm}>Nenhuma prova social enviada para esta OSC.</p>}
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Resgates Efetuados ({userRedemptions.length})</h4>
                    {userRedemptions.length > 0 ? (
                      <ul className={styles.historyList}>
                        {userRedemptions.map(redemption => (
                          <li key={redemption.id}>
                            <div className={styles.historyMain}>
                              <strong>{redemption.prize_name}</strong>
                              <span className={styles.historyDate}>{formatDateTime(redemption.redemption_date)}</span>
                            </div>
                            <span className={styles.negativeSeals}>-{redemption.seals_redeemed} Selos</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className={styles.emptyTextSm}>Nenhum resgate efetuado por este utilizador.</p>}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </ContentWrapper>
  );
};

export default OngReportsPage;