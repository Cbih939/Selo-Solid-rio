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

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [filteredOngs, setFilteredOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('all');
  const [ongSearchTerm, setOngSearchTerm] = useState('');
  
  // Estados de Pesquisa
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  // 1. Carrega as OSCs
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

  // 2. Carrega Dados Gerais (Estatísticas e Beneficiários)
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
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null);
      } finally { setLoading(false); }
    };
    
    const debounceFetch = setTimeout(() => { fetchReportData(); }, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedOng, userSearchTerm]);

  // 3. Carrega o Histórico de Auditoria
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

  const handleViewDetails = (title, data, headers) => {
    setModalContent({
      title,
      data: Array.isArray(data) ? data : [],
      headers: headers || (data && data.length > 0 ? Object.keys(data[0]) : [])
    });
    setModalOpen(true);
  };

  const generatePDF = () => {
    if (!modalContent.data || modalContent.data.length === 0) {
      alert("Não há dados para gerar o PDF."); return null;
    }
    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    
    const tableColumn = modalContent.headers.map(translateHeader);
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => {
        if (header === 'redemption_date' || header === 'submission_date') {
            return new Date(item[header]).toLocaleString('pt-BR');
        }
        return item[header] ?? '';
    }));
    
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 24 });
    return doc;
  };

  const handlePrint = () => {
    const doc = generatePDF();
    if (doc) { doc.autoPrint(); window.open(doc.output('bloburl'), '_blank'); }
  };

  const handleShare = async () => {
    const doc = generatePDF();
    if (!doc) return;
    const pdfFileName = `${modalContent.title.replace(/ /g, '_')}.pdf`;
    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      const shareData = { title: modalContent.title, text: `Confira o relatório: ${modalContent.title}`, files: [pdfFile] };
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else { doc.save(pdfFileName); }
    } catch (error) {
      console.error('Erro ao compartilhar:', error); doc.save(pdfFileName);
    }
  };

  // --- LÓGICA DE ORDENAÇÃO E AGRUPAMENTO --- //
  
  // DEFINIÇÃO DA VARIÁVEL DATA (A que faltava e causou o erro no build)
  const data = reportData;

  // Beneficiários (A-Z)
  const sortedUsers = data?.allUsers 
    ? [...data.allUsers].sort((a, b) => a.name.localeCompare(b.name)) 
    : [];

  // Auditoria (Filtro -> Agrupamento -> Ordenação A-Z)
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

  if (loading && !reportData) {
    return <ContentWrapper title="Relatórios"><p>A carregar relatórios globais...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios">
      
      {/* FILTROS GLOBAIS */}
      <div className={styles.filters}>
        <InputField
          label="Pesquisar OSC"
          placeholder="Digite o nome da OSC..."
          value={ongSearchTerm}
          onChange={(e) => setOngSearchTerm(e.target.value)}
        />
        <SelectField label="Filtrar por OSC" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
          <option value="all">Todas as OSCs</option>
          {filteredOngs.map(ong => (
            <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
          ))}
        </SelectField>
      </div>

      {data ? (
        <>
          {/* ESTATÍSTICAS GERAIS */}
          <div className={styles.reportBlock}>
            <ReportSection title="Estatísticas Gerais">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}><p>Beneficiários</p><span>{data.generalStats?.totalUsers || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#d1fae5' }}><p>Selos Ativos</p><span>{data.generalStats?.totalSealsInCirculation || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}><p>Selos Usados</p><span>{data.generalStats?.totalSealsRedeemed || 0}</span></div>
              </div>
            </ReportSection>
          </div>

          {/* BENEFICIÁRIOS CADASTRADOS (EM LISTA A-Z) */}
          <div className={styles.reportBlock}>
            <ReportSection title="Beneficiários Cadastrados (A-Z)">
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
                  <div key={user.id} className={styles.userListItem}>
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
                        <strong>{user.dependents_count}</strong> Dependentes
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className={styles.emptyMessage}>Nenhum beneficiário encontrado.</p>
                )}
              </div>
            </ReportSection>
          </div>

          {/* HISTÓRICO DE AVALIAÇÕES (AGRUPADO E A-Z) */}
          <div className={styles.reportBlock}>
            <ReportSection title="Auditoria de Provas Sociais (A-Z)">
              <div className={styles.sectionHeader}>
                <InputField
                  label="Filtrar Histórico"
                  placeholder="Pesquisar por nome, OSC, atividade..."
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

                      {/* Lista de Logs deste Utilizador */}
                      <div className={styles.logGrid}>
                        {groupedLogs[userName].map(log => (
                          <div key={log.id} className={styles.logCard}>
                            
                            <div className={styles.logHeader}>
                              <h5>{log.activity_title} <span className={styles.sealBadge}>+{log.seal_value} Selos</span></h5>
                              {selectedOng === 'all' && <span className={styles.ongBadge}>{log.ong_name || 'Sem OSC'}</span>}
                            </div>

                            <div className={styles.logBody}>
                              <div className={styles.logRow}>
                                <span><strong>Enviado em:</strong> {formatDateTime(log.sent_at)}</span>
                              </div>
                              <div className={styles.logRow}>
                                <span><strong>Avaliado por:</strong> {log.evaluator_name || 'Desconhecido'}</span>
                                <span><strong>Data:</strong> {formatDateTime(log.evaluated_at)}</span>
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
        !loading && <p className={styles.emptyMessage}>Não foi possível carregar os dados para a seleção atual.</p>
      )}

      {/* MODAL DE DETALHES GERAIS */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>{modalContent.headers.map(key => <th key={key}>{translateHeader(key)}</th>)}</tr>
              </thead>
              <tbody>
                {modalContent.data.map((item, index) => (
                  <tr key={index}>
                    {modalContent.headers.map(header => (
                      <td key={`${index}-${header}`}>
                        {header === 'redemption_date' || header === 'submission_date'
                          ? new Date(item[header]).toLocaleString('pt-BR')
                          : item[header]}
                      </td>
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
    </ContentWrapper>
  );
};

export default ReportsPage;