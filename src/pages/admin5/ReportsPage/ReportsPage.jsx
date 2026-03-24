import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

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

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [filteredOngs, setFilteredOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('all');
  const [ongSearchTerm, setOngSearchTerm] = useState('');
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProofs, setUserProofs] = useState([]);
  const [loadingUserProofs, setLoadingUserProofs] = useState(false);

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(response.data);
        setFilteredOngs(response.data);
      } catch (error) { console.error("Erro ao buscar ONGs:", error); }
    };
    fetchOngs();
  }, []);

  useEffect(() => {
    const lowercasedFilter = ongSearchTerm.toLowerCase();
    const filtered = ongs.filter(ong => ong.fantasy_name.toLowerCase().includes(lowercasedFilter));
    setFilteredOngs(filtered);
  }, [ongSearchTerm, ongs]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = {
          ongId: selectedOng === 'all' ? undefined : selectedOng,
          search: userSearchTerm || undefined
        };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
        setReportData(null);
      } finally { setLoading(false); }
    };
    const debounceFetch = setTimeout(() => { fetchReportData(); }, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedOng, userSearchTerm]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoadingAudit(true);
      try {
        const response = await api.get(`/proofs/log/${selectedOng}`);
        setAuditLogs(response.data);
      } catch (error) {
        console.error("Erro ao carregar auditoria:", error);
        setAuditLogs([]);
      } finally { setLoadingAudit(false); }
    };
    fetchAuditLogs();
  }, [selectedOng]);

  const handleOpenUserProfile = async (user) => {
    setSelectedUserProfile(user);
    setIsUserProfileOpen(true);
    setLoadingUserProofs(true);
    try {
      const response = await api.get(`/proofs/user/${user.id}`);
      setUserProofs(response.data);
    } catch (error) {
      console.error("Erro ao buscar provas do usuário:", error);
      setUserProofs([]);
    } finally {
      setLoadingUserProofs(false);
    }
  };

  // ++ NOVA FUNÇÃO: GERAR DOSSIÊ DO UTILIZADOR EM PDF ++
  const handleDownloadUserDossier = () => {
    if (!selectedUserProfile) return;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Dossie do Beneficiario: ${selectedUserProfile.name}`, 14, 20);
    
    // Dados Pessoais
    autoTable(doc, {
      startY: 28,
      head: [['Dados Pessoais', 'Informação']],
      body: [
        ['CPF', selectedUserProfile.cpf],
        ['E-mail', selectedUserProfile.email || 'Não informado'],
        ['Telefone', selectedUserProfile.phone || 'Não informado'],
        ['Saldo Atual', `${selectedUserProfile.seal_balance} Selos`],
        ['Selos Usados', `${selectedUserProfile.used_seals || 0} Selos`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
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
      body: proofsBody.length > 0 ? proofsBody : [['Nenhuma prova enviada', '', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
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
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Dossie_${selectedUserProfile.name.replace(/ /g, '_')}.pdf`);
  };

  const handleViewDetails = (title, data, headers) => {
    setModalContent({ title, data: Array.isArray(data) ? data : [], headers: headers || (data && data.length > 0 ? Object.keys(data[0]) : []) });
    setModalOpen(true);
  };

  const generatePDF = () => {
    if (!modalContent.data || modalContent.data.length === 0) return null;
    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    const tableColumn = modalContent.headers.map(translateHeader);
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => {
        if (header === 'redemption_date' || header === 'submission_date') return new Date(item[header]).toLocaleString('pt-BR');
        return item[header] ?? '';
    }));
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 24 });
    return doc;
  };

  const handlePrint = () => { const doc = generatePDF(); if (doc) { doc.autoPrint(); window.open(doc.output('bloburl'), '_blank'); } };

  const handleShare = async () => {
    const doc = generatePDF();
    if (!doc) return;
    const pdfFileName = `${modalContent.title.replace(/ /g, '_')}.pdf`;
    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      const shareData = { title: modalContent.title, text: `Confira o relatório: ${modalContent.title}`, files: [pdfFile] };
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) await navigator.share(shareData);
      else doc.save(pdfFileName);
    } catch (error) { doc.save(pdfFileName); }
  };

  const data = reportData;

  const sortedUsers = data?.allUsers ? [...data.allUsers].sort((a, b) => a.name.localeCompare(b.name)) : [];

  const filteredLogs = auditLogs.filter(log => {
    const term = auditSearchTerm.toLowerCase();
    return (
      (log.sender_name && log.sender_name.toLowerCase().includes(term)) ||
      (log.activity_title && log.activity_title.toLowerCase().includes(term)) ||
      (log.evaluator_name && log.evaluator_name.toLowerCase().includes(term)) ||
      (log.ong_name && log.ong_name.toLowerCase().includes(term))
    );
  });

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const userName = log.sender_name || 'Utilizador Desconhecido';
    if (!acc[userName]) acc[userName] = [];
    acc[userName].push(log);
    return acc;
  }, {});

  const sortedLogUsers = Object.keys(groupedLogs).sort((a, b) => a.localeCompare(b));

  if (loading && !reportData) return <ContentWrapper title="Relatórios"><p>A carregar relatórios globais...</p></ContentWrapper>;

  const userRedemptions = selectedUserProfile && data?.allRedemptions ? data.allRedemptions.filter(r => r.user_id === selectedUserProfile.id) : [];

  return (
    <ContentWrapper title="Relatórios">
      
      <div className={styles.filters}>
        <InputField label="Pesquisar OSC" placeholder="Digite o nome da OSC..." value={ongSearchTerm} onChange={(e) => setOngSearchTerm(e.target.value)} />
        <SelectField label="Filtrar por OSC" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
          <option value="all">Todas as OSCs</option>
          {filteredOngs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
        </SelectField>
      </div>

      {data ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Estatísticas Gerais">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}><p>Beneficiários</p><span>{data.generalStats?.totalUsers || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#d1fae5' }}><p>Selos Ativos</p><span>{data.generalStats?.totalSealsInCirculation || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}><p>Selos Usados</p><span>{data.generalStats?.totalSealsRedeemed || 0}</span></div>
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Beneficiários Cadastrados (A-Z)">
              <div className={styles.sectionHeader}>
                <InputField label="Filtrar Beneficiários" placeholder="Nome ou CPF..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
              </div>
              <div className={styles.groupedListContainer}>
                {sortedUsers.length > 0 ? sortedUsers.map(user => (
                  <div key={user.id} className={styles.userListItemClickable} onClick={() => handleOpenUserProfile(user)} title="Clique para ver o perfil completo">
                    <div className={styles.userMainInfo}>
                      <span className={styles.userAvatarSm}>{user.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <h4 className={styles.userNameTitle}>{user.name}</h4>
                        <span className={styles.userSubText}>CPF: {user.cpf}</span>
                      </div>
                    </div>
                    <div className={styles.userStats}>
                      <div className={styles.statPill}><strong>{user.seal_balance}</strong> Selos</div>
                      <div className={styles.statPillLight}><strong>{user.dependents_count || (user.dependents ? user.dependents.length : 0)}</strong> Dependentes</div>
                    </div>
                  </div>
                )) : <p className={styles.emptyMessage}>Nenhum beneficiário encontrado.</p>}
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Auditoria de Provas Sociais (A-Z)">
              <div className={styles.sectionHeader}>
                <InputField label="Filtrar Histórico" placeholder="Pesquisar por nome, OSC, atividade..." value={auditSearchTerm} onChange={(e) => setAuditSearchTerm(e.target.value)} />
              </div>
              <div className={styles.groupedListContainer}>
                {loadingAudit ? <p className={styles.loadingText}>A carregar auditoria...</p> : sortedLogUsers.length > 0 ? sortedLogUsers.map(userName => (
                  <div key={userName} className={styles.userGroup}>
                    <div className={styles.userGroupHeader}>
                      <div className={styles.userInfo}>
                        <span className={styles.userAvatarSm}>{userName.charAt(0).toUpperCase()}</span>
                        <h4 className={styles.userNameTitle}>{userName}</h4>
                      </div>
                      <span className={styles.badgeCount}>{groupedLogs[userName].length} registo(s)</span>
                    </div>
                    <div className={styles.logGrid}>
                      {groupedLogs[userName].map(log => (
                        <div key={log.id} className={styles.logCard}>
                          <div className={styles.logHeader}>
                            <h5>{log.activity_title} <span className={styles.sealBadge}>+{log.seal_value} Selos</span></h5>
                            {selectedOng === 'all' && <span className={styles.ongBadge}>{log.ong_name || 'Sem OSC'}</span>}
                          </div>
                          <div className={styles.logBody}>
                            <div className={styles.logRow}><span><strong>Enviado em:</strong> {formatDateTime(log.sent_at)}</span></div>
                            <div className={styles.logRow}><span><strong>Avaliado por:</strong> {log.evaluator_name || 'Desconhecido'}</span><span><strong>Data:</strong> {formatDateTime(log.evaluated_at)}</span></div>
                          </div>
                          <div className={styles.logFooter}>
                            <span className={log.status === 'approved' ? styles.statusApproved : styles.statusRejected}>{log.status === 'approved' ? 'Aprovada' : 'Rejeitada'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : <p className={styles.emptyMessage}>Nenhum registo de avaliação encontrado.</p>}
              </div>
            </ReportSection>
          </div>
        </>
      ) : (!loading && <p className={styles.emptyMessage}>Não foi possível carregar os dados para a seleção atual.</p>)}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <div className={styles.tableContainer}>
            <table>
              <thead><tr>{modalContent.headers.map(key => <th key={key}>{translateHeader(key)}</th>)}</tr></thead>
              <tbody>
                {modalContent.data.map((item, index) => (
                  <tr key={index}>
                    {modalContent.headers.map(header => (
                      <td key={`${index}-${header}`}>{header === 'redemption_date' || header === 'submission_date' ? new Date(item[header]).toLocaleString('pt-BR') : item[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.shareButtons}>
            <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
            <Button variant="primary" onClick={handleShare}>Compartilhar</Button>
          </div>
        </div>
      </Modal>

      {/* ++ MODAL ATUALIZADO: VISÃO 360 DO UTILIZADOR COM DOWNLOAD E AUDITORIA ++ */}
      <Modal isOpen={isUserProfileOpen} onClose={() => setIsUserProfileOpen(false)} title="Perfil Completo do Beneficiário">
        {selectedUserProfile && (
          <div className={styles.profileModalScroll}>
            
            <div className={styles.profileHeader}>
              <div className={styles.profileHeaderLeft}>
                <div className={styles.profileAvatarLg}>{selectedUserProfile.name.charAt(0).toUpperCase()}</div>
                <div className={styles.profileHeaderInfo}>
                  <h2>{selectedUserProfile.name}</h2>
                  <p>Membro desde: {formatDateOnly(selectedUserProfile.created_at)}</p>
                </div>
              </div>
              <Button variant="primary" onClick={handleDownloadUserDossier}>Baixar Dossiê PDF</Button>
            </div>

            <div className={styles.profileGrid}>
              {/* Coluna 1: Dados, Carteira e Dependentes */}
              <div className={styles.profileCol}>
                <div className={styles.profileSection}>
                  <h4 className={styles.profileSectionTitle}>Dados Pessoais</h4>
                  <ul className={styles.profileDataList}>
                    <li><strong>CPF:</strong> {selectedUserProfile.cpf}</li>
                    <li><strong>E-mail:</strong> {selectedUserProfile.email || 'Não informado'}</li>
                    <li><strong>Telefone:</strong> {selectedUserProfile.phone || 'Não informado'}</li>
                  </ul>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={styles.profileSectionTitle}>Carteira de Selos</h4>
                  <div className={styles.walletCards}>
                    <div className={styles.walletCardActive}>
                      <span>Saldo Atual</span>
                      <strong>{selectedUserProfile.seal_balance}</strong>
                    </div>
                    <div className={styles.walletCardUsed}>
                      <span>Selos Usados</span>
                      <strong>{selectedUserProfile.used_seals || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.profileSection}>
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

              {/* Coluna 2: Provas e Resgates (Agora mais larga) */}
              <div className={styles.profileColWide}>
                
                <div className={styles.profileSection}>
                  <h4 className={styles.profileSectionTitle}>Provas Sociais Enviadas ({userProofs.length})</h4>
                  {loadingUserProofs ? (
                    <p className={styles.emptyTextSm}>A carregar provas...</p>
                  ) : userProofs.length > 0 ? (
                    <div className={styles.scrollableList}>
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
                            
                            {/* Novo bloco de informação de quem avaliou */}
                            {proof.status !== 'pending' && (
                              <div className={styles.proofEvalInfo}>
                                <span><strong>Avaliado por:</strong> {proof.evaluator_name || 'Sistema / Desconhecido'}</span>
                                <span><strong>Data:</strong> {formatDateTime(proof.evaluated_at)}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : <p className={styles.emptyTextSm}>Nenhuma prova social enviada.</p>}
                </div>

                <div className={styles.profileSection}>
                  <h4 className={styles.profileSectionTitle}>Histórico de Resgates ({userRedemptions.length})</h4>
                  {userRedemptions.length > 0 ? (
                    <div className={styles.scrollableList}>
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
                    </div>
                  ) : <p className={styles.emptyTextSm}>Este utilizador ainda não efetuou resgates.</p>}
                </div>

              </div>
            </div>
          </div>
        )}
      </Modal>

    </ContentWrapper>
  );
};

export default ReportsPage;