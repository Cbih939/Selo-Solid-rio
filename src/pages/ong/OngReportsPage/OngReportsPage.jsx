// Arquivo: src/pages/ong/OngReportsPage/OngReportsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngReportsPage.module.css';

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
  const [ongName, setOngName] = useState('Minha Organização');
  
  // --- Estados de Filtro (Usuários) ---
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filterSeals, setFilterSeals] = useState('all'); 
  const [sortBy, setSortBy] = useState('name_asc'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProofs, setUserProofs] = useState([]);
  const [loadingUserProofs, setLoadingUserProofs] = useState(false);

  const myOngId = currentUser?.ong_id || currentUser?.id;

  useEffect(() => {
    if (!myOngId) return;
    const fetchOngDetails = async () => {
      try {
        const response = await api.get(`/ongs/${myOngId}`); 
        setOngName(response.data.fantasy_name || 'Organização');
      } catch (error) {
        console.error("Erro ao buscar nome da organização:", error);
        setOngName(currentUser?.ong_name || 'Minha Organização');
      }
    };
    fetchOngDetails();
  }, [myOngId, currentUser]);

  useEffect(() => {
    if (!myOngId) { setLoading(false); return; }
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = { ongId: myOngId };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null);
      } finally { setLoading(false); }
    };
    
    fetchReportData();
  }, [myOngId]);

  useEffect(() => {
    if (!myOngId) return;
    const fetchAuditLogs = async () => {
      setLoadingAudit(true);
      try {
        const response = await api.get(`/proofs/log/${myOngId}`);
        setAuditLogs(response.data);
      } catch (error) {
        console.error("Erro 500 do Backend na rota de auditoria:", error);
        // O backend está a devolver erro 500 nesta rota, por isso capturamos para não quebrar a tela
        setAuditLogs([]);
      } finally { setLoadingAudit(false); }
    };
    fetchAuditLogs();
  }, [myOngId]);

  // ==========================================
  // LÓGICA DE FILTRAGEM AVANÇADA
  // ==========================================
  const processedUsers = useMemo(() => {
    if (!reportData || !reportData.allUsers) return [];
    
    let filtered = reportData.allUsers.filter(u => {
      const term = userSearchTerm.toLowerCase();
      const matchesSearch = 
        (u.name && u.name.toLowerCase().includes(term)) || 
        (u.email && u.email.toLowerCase().includes(term)) || 
        (u.cpf && u.cpf.includes(term)) || 
        (u.id && u.id.toString() === term);

      const matchesSeals = filterSeals === 'all' ? true : filterSeals === 'with' ? u.seal_balance > 0 : u.seal_balance === 0;

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

    return filtered;
  }, [reportData, userSearchTerm, filterSeals, sortBy, startDate, endDate]);

  const handleOpenUserProfile = async (user) => {
    setSelectedUserProfile(user);
    setIsUserProfileOpen(true);
    setLoadingUserProofs(true);
    try {
      const profileRes = await api.get(`/users/${user.id}/details`);
      const detailedUser = {
        ...profileRes.data.usuario,
        dependents: profileRes.data.dependentes || [],
        used_seals: profileRes.data.used_seals || 0,
        total_earned_seals: profileRes.data.total_earned_seals || user.seal_balance || 0
      };
      
      try {
          detailedUser.social_benefits = detailedUser.social_benefits ? JSON.parse(detailedUser.social_benefits) : [];
          detailedUser.public_services_access = detailedUser.public_services_access ? JSON.parse(detailedUser.public_services_access) : [];
          detailedUser.main_needs = detailedUser.main_needs ? JSON.parse(detailedUser.main_needs) : [];
      } catch(e) {}

      setSelectedUserProfile({ ...user, ...detailedUser });

      const response = await api.get(`/proofs/user/${user.id}`);
      const ongProofs = response.data.filter(p => p.ong_id === myOngId);
      setUserProofs(ongProofs);
    } catch (error) {
      console.error("Erro ao buscar provas do usuário:", error);
      setUserProofs([]);
    } finally {
      setLoadingUserProofs(false);
    }
  };

  // --- IMPRESSÃO DO RELATÓRIO GERAL ---
  const handleDownloadGeneralReport = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const PRINT_DATE_TIME = new Date().toLocaleString('pt-BR');

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Selo Cidadania", 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Organização (OSC): ${ongName}`, 196, 15, { align: 'right' });
    doc.text(`Relatório gerado em: ${PRINT_DATE_TIME}`, 196, 20, { align: 'right' });

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório Geral da Organização`, 105, 35, { align: 'center' });
    doc.setFont("helvetica", "normal");

    // Recalcula totais para a impressão (Garante que são números)
    const tCirculation = Number(reportData?.generalStats?.totalSealsInCirculation || 0);
    const tRedeemed = Number(reportData?.generalStats?.totalSealsRedeemed || 0);
    const tEarned = tCirculation + tRedeemed;
    const tUsers = reportData?.generalStats?.totalUsers || 0;

    autoTable(doc, {
      startY: 45,
      head: [['Métricas Globais do Sistema', 'Valores Totais']],
      body: [
        ['Beneficiários Cadastrados', tUsers],
        ['Total de Selos Enviados (Ganhos na História)', tEarned],
        ['Total de Selos Debitados (Resgatados)', tRedeemed],
        ['Selos em Circulação (Saldo Atual Ativo)', tCirculation]
      ],
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] }, // Laranja
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { fontStyle: 'bold', halign: 'center' } }
    });

    const userRows = processedUsers.map(u => [
      u.name, 
      u.cpf || 'N/A', 
      u.seal_balance,
      formatDateOnly(u.created_at)
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Nome do Beneficiário', 'CPF', 'Saldo Atual', 'Cadastrado em']],
      body: userRows.length > 0 ? userRows : [['Nenhum beneficiário encontrado', '', '', '']],
      theme: 'striped',
      headStyles: { fillColor: [153, 27, 27] }, // Vermelho Escuro
      styles: { fontSize: 9 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages} - Relatório oficial gerado pelo Sistema Selo Cidadania`, 105, 285, { align: 'center' });
    }

    doc.save(`Relatorio_Geral_${ongName.replace(/ /g, '_')}.pdf`);
  };

  // --- IMPRESSÃO DO DOSSIÊ DO USUÁRIO ---
  const handleDownloadUserDossier = () => {
    if (!selectedUserProfile) return;
    const doc = new jsPDF();
    const p = selectedUserProfile;
    const PRINT_DATE_TIME = new Date().toLocaleString('pt-BR');

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Selo Cidadania", 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Organização (OSC): ${ongName}`, 196, 15, { align: 'right' });
    doc.text(`Relatório gerado em: ${PRINT_DATE_TIME}`, 196, 20, { align: 'right' });

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Dossiê do Beneficiário`, 105, 35, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(p.name, 105, 43, { align: 'center' });
    doc.setFont("helvetica", "normal");

    const formattedAddress = p.logradouro ?
        `${p.logradouro}, nº ${p.numero}${p.complemento ? ' (' + p.complemento + ')' : ''}, ${p.bairro}, ${p.cidade}/${p.estado}. CEP: ${p.cep}`
        : 'Endereço não cadastrado.';

    // Tabela 1: Identificação Básica
    autoTable(doc, {
      startY: 50,
      head: [['Identificação e Contato', '']],
      body: [
        ['CPF', p.cpf || 'Não informado'],
        ['RG', p.rg || 'Não informado'],
        ['Data de Nascimento', formatDateOnly(p.birth_date)],
        ['Nome da Mãe', p.mothers_name || 'Não informado'],
        ['E-mail', p.email || 'Não informado'],
        ['Telefone / WhatsApp', p.phone || 'Não informado'],
        ['Endereço Cadastrado', formattedAddress] 
      ],
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] }, // Laranja (#ea580c)
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
    });

    // Tabela 2: Resumo Financeiro (Selos)
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Resumo Financeiro de Selos', '']],
        body: [
          ['Total de Selos Adquiridos (Histórico)', p.total_earned_seals || p.seal_balance || '0'],
          ['Selos Utilizados (Resgates)', p.used_seals || '0'],
          ['Saldo Atual em Carteira', p.seal_balance || '0']
        ],
        theme: 'grid',
        headStyles: { fillColor: [153, 27, 27] }, // Vermelho Escuro (#991b1b)
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
    });

    // Tabela 3: Mapeamento Social
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Mapeamento Social e Habitacional', '']],
        body: [
          ['Tamanho da Família / Cômodos', `${p.household_size || '-'} pessoas / ${p.rooms_count || '-'} cômodos`],
          ['Infraestrutura Básica', `Água: ${p.has_water ? 'Sim':'Não'} | Esgoto: ${p.has_sanitation ? 'Sim':'Não'} | Luz: ${p.has_electricity ? 'Sim':'Não'}`],
          ['Situação de Trabalho / Renda', `${p.employment_status || '-'} / R$ ${p.family_income || '-'}`],
          ['Benefícios Sociais', Array.isArray(p.social_benefits) ? p.social_benefits.join(', ') : 'Não informado'],
          ['Acesso a Serviços Públicos', Array.isArray(p.public_services_access) ? p.public_services_access.join(', ') : 'Não informado'],
          ['Maiores Necessidades', Array.isArray(p.main_needs) ? p.main_needs.join(', ') : 'Não informado']
        ],
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] }, 
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
      });

    const deps = p.dependents || [];
    const dependentsBody = deps.map(d => [d.full_name || d.name, formatDateOnly(d.birth_date), d.cpf || '-', d.kinship || '-']);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Dependentes', 'Data Nascimento', 'CPF', 'Parentesco']],
      body: dependentsBody.length > 0 ? dependentsBody : [['Nenhum dependente cadastrado.', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27] }, 
      styles: { fontSize: 9 }
    });

    const proofsBody = userProofs.map(proof => [
      proof.title, formatDateOnly(proof.created_at),
      proof.status === 'approved' ? 'Aprovada' : proof.status === 'rejected' ? 'Rejeitada' : 'Pendente',
      proof.evaluator_name || '-'
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Atividade/Prova Social', 'Data Envio', 'Status', 'Avaliador']],
      body: proofsBody.length > 0 ? proofsBody : [['Nenhuma prova social enviada.', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] }, 
      styles: { fontSize: 8 }
    });

    const userRedemptions = reportData?.allRedemptions ? reportData.allRedemptions.filter(r => r.user_id === p.id) : [];
    const redemptionsBody = userRedemptions.map(r => [
      r.prize_name, formatDateOnly(r.redemption_date), `-${r.seals_redeemed} Selos`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Histórico de Resgates', 'Data do Resgate', 'Custo em Selos']],
      body: redemptionsBody.length > 0 ? redemptionsBody : [['Nenhum resgate efetuado.', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27] }, 
      styles: { fontSize: 9 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages} - Relatório oficial gerado pelo Sistema Selo Cidadania`, 105, 285, { align: 'center' });
    }

    doc.save(`Dossie_${p.name.replace(/ /g, '_')}.pdf`);
  };

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
    return <ContentWrapper title="Relatórios e Auditoria"><p>A carregar relatórios da organização...</p></ContentWrapper>;
  }

  // CORREÇÃO MAGISTRAL: Conversão explícita para Number para evitar concatenação de strings (ex: "9591" + "58" = "959158")
  const totalCirculation = Number(reportData?.generalStats?.totalSealsInCirculation || 0);
  const totalRedeemed = Number(reportData?.generalStats?.totalSealsRedeemed || 0);
  const totalEarned = totalCirculation + totalRedeemed;

  const userRedemptions = selectedUserProfile && reportData?.allRedemptions 
    ? reportData.allRedemptions.filter(r => r.user_id === selectedUserProfile.id) 
    : [];

  return (
    <ContentWrapper title="Relatórios e Auditoria">
      
      {reportData ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title={`Métricas Gerais: ${ongName}`}>
              
              {/* CABEÇALHO COM BOTÃO DE IMPRESSÃO GERAL */}
              <div className={styles.generalPrintHeader}>
                <p>Resumo Financeiro e de Atividades da Organização</p>
                <Button onClick={handleDownloadGeneralReport} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                  🖨️ Imprimir Relatório Geral
                </Button>
              </div>

              <div className={styles.sectionHeaderStats}>
                <div className={styles.statCard} style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}>
                  <p>Total de Selos Enviados (Ganhos)</p>
                  <span style={{ color: '#ea580c' }}>{totalEarned}</span>
                </div>
                <div className={styles.statCard} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                  <p>Total de Selos Debitados (Usados)</p>
                  <span style={{ color: '#dc2626' }}>{totalRedeemed}</span>
                </div>
                <div className={styles.statCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <p>Selos Atuais em Circulação (Saldo)</p>
                  <span style={{ color: '#16a34a' }}>{totalCirculation}</span>
                </div>
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Dossiê de Beneficiários">
              
              {/* BARRA DE FILTROS AVANÇADOS */}
              <div className={styles.filterSection}>
                <div className={styles.searchRow}>
                  <div style={{ flex: 1 }}>
                    <InputField label="Pesquisa Direta" name="search" placeholder="Nome, E-mail, CPF ou ID exato..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
                  </div>
                  <div className={styles.filterGroup}>
                     <label className={styles.filterLabel}>Ordenar por</label>
                     <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="name_asc">Nome (A-Z)</option><option value="name_desc">Nome (Z-A)</option>
                        <option value="seals_desc">Maior Saldo</option><option value="seals_asc">Menor Saldo</option>
                        <option value="cpf_asc">CPF Crescente</option>
                     </select>
                  </div>
                  <div className={styles.filterGroup}>
                     <label className={styles.filterLabel}>Filtro de Selos</label>
                     <select className={styles.filterSelect} value={filterSeals} onChange={(e) => setFilterSeals(e.target.value)}>
                        <option value="all">Todos os Beneficiários</option>
                        <option value="with">Apenas COM Selos</option><option value="without">Apenas SEM Selos</option>
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
                  <div className={styles.resultsCount}>Exibindo <strong>{processedUsers.length}</strong> beneficiário(s)</div>
                </div>
              </div>
              
              <div className={styles.groupedListContainer}>
                {processedUsers.length > 0 ? processedUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={styles.userListItemClickable} 
                    onClick={() => handleOpenUserProfile(user)}
                    title="Clique para ver o dossiê completo"
                  >
                    <div className={styles.userMainInfo}>
                      <span className={styles.userAvatarSm}>{user.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <h4 className={styles.userNameTitle}>{user.name}</h4>
                        <span className={styles.userSubText}>CPF: {user.cpf || 'N/A'} | ID: {user.id}</span>
                      </div>
                    </div>
                    <div className={styles.userStats}>
                      <div className={styles.statPill}>
                        <strong>{user.seal_balance}</strong> Selos
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className={styles.emptyMessage}>Nenhum beneficiário encontrado com os filtros atuais.</p>
                )}
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Auditoria de Provas Sociais e Atividades">
              <div className={styles.filterSection} style={{ marginBottom: '20px' }}>
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
                            </div>

                            <div className={styles.logBody}>
                              <div className={styles.logRow}>
                                <span><strong>Enviado em:</strong> {formatDateTime(log.sent_at)}</span>
                              </div>
                              <div className={styles.logRow}>
                                <span><strong>Avaliador:</strong> {log.evaluator_name || 'Automático'}</span>
                                <span><strong>Data:</strong> {formatDateTime(log.evaluated_at)}</span>
                              </div>
                              {log.feedback_message && (
                                <div className={styles.logRow} style={{ marginTop: '10px', backgroundColor: '#fff7ed', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #ea580c' }}>
                                  <span><strong>Feedback:</strong> {log.feedback_message}</span>
                                </div>
                              )}
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

      {/* ========================================================= */}
      {/* MODAL 360 DO USUÁRIO (DOSSIÊ COMPLETO)                    */}
      {/* ========================================================= */}
      {isUserProfileOpen && selectedUserProfile && (
        <div className={styles.customOverlay} onClick={() => setIsUserProfileOpen(false)}>
          <div className={styles.customModalLg} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.customModalHeader}>
              <div className={styles.modalHeaderTitle}>
                <h3>Dossiê Completo do Beneficiário</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsUserProfileOpen(false)}>×</button>
            </div>

            <div className={styles.customModalBody}>
              
              <div className={styles.profileHeaderCard}>
                <div className={styles.profileHeaderLeft}>
                  <div className={styles.profileAvatarLg}>{selectedUserProfile.name.charAt(0).toUpperCase()}</div>
                  <div className={styles.profileHeaderInfo}>
                    <h2>{selectedUserProfile.name}</h2>
                    <p>Membro desde: {formatDateOnly(selectedUserProfile.created_at)}</p>
                  </div>
                </div>
                <button className={styles.downloadBtn} onClick={handleDownloadUserDossier}>
                  📥 Imprimir Relatório Oficial
                </button>
              </div>

              {/* LOG FINANCEIRO NO TOPO DO DOSSIÊ */}
              <div className={styles.sealSummaryBlock}>
                 <div className={styles.sealSummaryContent}>
                   <div className={styles.sealSummaryItem}>
                      <span className={styles.sealSummaryLabel}>Total Adquirido</span>
                      <span className={`${styles.sealSummaryValue} ${styles.valOrange}`}>{selectedUserProfile.total_earned_seals || selectedUserProfile.seal_balance || 0}</span>
                   </div>
                   <div className={styles.sealSummaryItem}>
                      <span className={styles.sealSummaryLabel}>Selos Usados</span>
                      <span className={`${styles.sealSummaryValue} ${styles.valRed}`}>{selectedUserProfile.used_seals || 0}</span>
                   </div>
                   <div className={styles.sealSummaryItem}>
                      <span className={styles.sealSummaryLabel}>Saldo Atual</span>
                      <span className={`${styles.sealSummaryValue} ${styles.valGreen}`}>{selectedUserProfile.seal_balance || 0}</span>
                   </div>
                 </div>
              </div>

              {/* LAYOUT EMPILHADO - NOVO PADRÃO */}
              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Dados Pessoais e Residenciais</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>CPF</span><span className={styles.infoValue}>{selectedUserProfile.cpf || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>RG</span><span className={styles.infoValue}>{selectedUserProfile.rg || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Data de Nascimento</span><span className={styles.infoValue}>{formatDateOnly(selectedUserProfile.birth_date)}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Nome da Mãe</span><span className={styles.infoValue}>{selectedUserProfile.mothers_name || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Telefone/WhatsApp</span><span className={styles.infoValue}>{selectedUserProfile.phone || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>E-mail</span><span className={styles.infoValue}>{selectedUserProfile.email || 'N/A'}</span></div>
                  <div className={styles.infoBlock} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>Endereço Completo</span>
                    <span className={styles.infoValue}>
                      {selectedUserProfile.logradouro ? 
                        `${selectedUserProfile.logradouro}, nº ${selectedUserProfile.numero}${selectedUserProfile.complemento ? ' ('+selectedUserProfile.complemento+')' : ''}. ${selectedUserProfile.bairro}. ${selectedUserProfile.cidade}/${selectedUserProfile.estado}. CEP: ${selectedUserProfile.cep}`
                        : 'Não informado'}
                    </span>
                  </div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Tempo no Local</span><span className={styles.infoValue}>{selectedUserProfile.residence_time || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Tipo de Habitação</span><span className={styles.infoValue}>{selectedUserProfile.housing_type || 'N/A'}</span></div>
                </div>
              </div>

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Condições e Mapeamento Social</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Pessoas na casa</span><span className={styles.infoValue}>{selectedUserProfile.household_size || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Cômodos</span><span className={styles.infoValue}>{selectedUserProfile.rooms_count || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Água Encanada</span><span className={styles.infoValue}>{selectedUserProfile.has_water ? 'Sim' : 'Não'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Saneamento</span><span className={styles.infoValue}>{selectedUserProfile.has_sanitation ? 'Sim' : 'Não'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Energia Elétrica</span><span className={styles.infoValue}>{selectedUserProfile.has_electricity ? 'Sim' : 'Não'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Escolaridade</span><span className={styles.infoValue}>{selectedUserProfile.education_level || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Situação Trabalho</span><span className={styles.infoValue}>{selectedUserProfile.employment_status || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Renda Familiar</span><span className={styles.infoValue}>{selectedUserProfile.family_income ? `R$ ${selectedUserProfile.family_income}` : 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Povos Tradicionais</span><span className={styles.infoValue}>{selectedUserProfile.traditional_community || 'Não'}</span></div>
                </div>
                
                <div className={styles.infoGrid} style={{ marginTop: '20px' }}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Benefícios Sociais</span>
                    <span className={styles.infoValue}>
                      {Array.isArray(selectedUserProfile.social_benefits) && selectedUserProfile.social_benefits.length > 0 
                        ? <div className={styles.pillsContainer}>{selectedUserProfile.social_benefits.map(b => <span key={b} className={styles.pillItem}>{b}</span>)}</div>
                        : <span className={styles.emptyTextSm}>Nenhum benefício informado</span>}
                    </span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Acesso a Serviços Públicos</span>
                    <span className={styles.infoValue}>
                      {Array.isArray(selectedUserProfile.public_services_access) && selectedUserProfile.public_services_access.length > 0 
                        ? <div className={styles.pillsContainer}>{selectedUserProfile.public_services_access.map(b => <span key={b} className={styles.pillItem}>{b}</span>)}</div>
                        : <span className={styles.emptyTextSm}>Nenhum acesso informado</span>}
                    </span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Maiores Necessidades</span>
                    <span className={styles.infoValue}>
                      {Array.isArray(selectedUserProfile.main_needs) && selectedUserProfile.main_needs.length > 0 
                        ? <div className={styles.pillsContainer}>{selectedUserProfile.main_needs.map(n => <span key={n} className={styles.pillItem}>{n}</span>)}</div>
                        : <span className={styles.emptyTextSm}>Não informado</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Dependentes ({selectedUserProfile.dependents?.length || 0})</h4>
                {selectedUserProfile.dependents && selectedUserProfile.dependents.length > 0 ? (
                  <div className={styles.tableResponsive}>
                    <table className={styles.dependentsTable}>
                      <thead><tr><th>Nome Completo</th><th>Nascimento</th><th>Parentesco</th><th>CPF</th></tr></thead>
                      <tbody>
                        {selectedUserProfile.dependents.map((dep, i) => (
                          <tr key={i}>
                            <td><strong>{dep.name || dep.full_name}</strong></td>
                            <td>{formatDateOnly(dep.birth_date)}</td>
                            <td>{dep.kinship}</td>
                            <td>{dep.cpf || 'S/N'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={styles.emptyTextSm}>Nenhum dependente cadastrado.</p>}
              </div>

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Histórico de Provas ({userProofs.length})</h4>
                {loadingUserProofs ? (
                  <p className={styles.emptyTextSm}>A carregar...</p>
                ) : userProofs.length > 0 ? (
                  <div className={styles.tableResponsive}>
                    <table className={styles.dependentsTable}>
                      <thead><tr><th>Atividade / Título</th><th>Data Envio</th><th>Status</th><th>Avaliador</th></tr></thead>
                      <tbody>
                        {userProofs.map(proof => (
                          <tr key={proof.id}>
                            <td>
                              <strong>{proof.title}</strong>
                              {proof.feedback_message && <span style={{display: 'block', fontSize: '0.8rem', color: '#ea580c', marginTop: '4px'}}>Obs: {proof.feedback_message}</span>}
                            </td>
                            <td>{formatDateTime(proof.created_at)}</td>
                            <td>
                              <span className={proof.status === 'approved' ? styles.statusApprovedSm : proof.status === 'rejected' ? styles.statusRejectedSm : styles.statusPendingSm}>
                                {proof.status === 'approved' ? 'Aprovada' : proof.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                              </span>
                            </td>
                            <td>{proof.status !== 'pending' ? (proof.evaluator_name || 'Sistema') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={styles.emptyTextSm}>Sem histórico de provas nesta OSC.</p>}
              </div>

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Histórico de Resgates ({userRedemptions.length})</h4>
                {userRedemptions.length > 0 ? (
                  <div className={styles.tableResponsive}>
                    <table className={styles.dependentsTable}>
                      <thead><tr><th>Prêmio Resgatado</th><th>Data do Resgate</th><th>Custo</th></tr></thead>
                      <tbody>
                        {userRedemptions.map(redemption => (
                          <tr key={redemption.id}>
                            <td><strong>{redemption.prize_name}</strong></td>
                            <td>{formatDateTime(redemption.redemption_date)}</td>
                            <td><span className={styles.negativeSeals}>-{redemption.seals_redeemed} Selos</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={styles.emptyTextSm}>Nenhum resgate efetuado.</p>}
              </div>

            </div>
          </div>
        </div>
      )}

    </ContentWrapper>
  );
};

export default OngReportsPage;