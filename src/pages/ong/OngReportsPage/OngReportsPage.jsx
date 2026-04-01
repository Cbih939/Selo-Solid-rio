// Arquivo: src/pages/ong/OngReportsPage/OngReportsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './OngReportsPage.module.css';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const IMAGE_BASE_URL = isLocalhost ? 'http://localhost:3002/api' : 'https://selocidadania.org.br/api';

const fetchImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(`${imageUrl}?t=${new Date().getTime()}`, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao converter logo para PDF:", error);
    return null;
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const [ongLogoUrl, setOngLogoUrl] = useState(null);
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filterSeals, setFilterSeals] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: '', endDate: '', gender: 'all', education: 'all', race: 'all'
  });

  const [selectedUsersForMassAction, setSelectedUsersForMassAction] = useState([]);
  const [massActionModal, setMassActionModal] = useState({ isOpen: false, status: 'active', message: '' });
  const [isMassUpdating, setIsMassUpdating] = useState(false);

  const myOngId = currentUser?.ong_id || currentUser?.id;

  useEffect(() => {
    if (!myOngId) return;
    const fetchOngDetails = async () => {
      try {
        const response = await api.get(`/ongs/${myOngId}`); 
        setOngName(response.data.fantasy_name || 'Organização');
        if (response.data.logo) {
          const cleanPath = response.data.logo.startsWith('/') ? response.data.logo : `/${response.data.logo}`;
          setOngLogoUrl(`${IMAGE_BASE_URL}${cleanPath}`);
        }
      } catch (error) { setOngName(currentUser?.ong_name || 'Minha Organização'); }
    };
    fetchOngDetails();
  }, [myOngId, currentUser]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports', { params: { ongId: myOngId } });
      setReportData(response.data);
    } catch (error) { setReportData(null); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (myOngId) fetchReportData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myOngId]);

  useEffect(() => {
    if (!myOngId) return;
    const fetchAuditLogs = async () => {
      setLoadingAudit(true);
      try {
        const response = await api.get(`/proofs/log/${myOngId}`);
        setAuditLogs(response.data);
      } catch (error) {
        setAuditLogs([]);
      } finally { setLoadingAudit(false); }
    };
    fetchAuditLogs();
  }, [myOngId]);

  const processedUsers = useMemo(() => {
    if (!reportData || !reportData.allUsers) return [];
    let filtered = reportData.allUsers.filter(u => {
      const term = userSearchTerm.toLowerCase();
      const matchesSearch = (u.name && u.name.toLowerCase().includes(term)) || (u.cpf && u.cpf.includes(term)) || (u.id && u.id.toString() === term);
      const matchesSeals = filterSeals === 'all' ? true : filterSeals === 'with' ? u.seal_balance > 0 : u.seal_balance === 0;
      
      const userStatus = u.attendance_status || 'active';
      const matchesStatus = filterStatus === 'all' ? true : userStatus === filterStatus;

      let matchesDate = true;
      const targetDate = u.last_analysis_date || u.created_at; 
      if (startDate) matchesDate = matchesDate && new Date(targetDate) >= new Date(startDate);
      if (endDate) {
        const end = new Date(endDate); end.setDate(end.getDate() + 1);
        matchesDate = matchesDate && new Date(targetDate) < end;
      }
      return matchesSearch && matchesSeals && matchesStatus && matchesDate;
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
  }, [reportData, userSearchTerm, filterSeals, filterStatus, sortBy, startDate, endDate]);

  const handleMassStatusUpdate = async (e) => {
    e.preventDefault();
    if (selectedUsersForMassAction.length === 0) return;
    setIsMassUpdating(true);

    const dataAtual = new Date().toISOString();
    // Identifica o nome real do administrador logado
    const adminRealName = currentUser?.name || currentUser?.fantasy_name || 'Administrador';

    try {
      for (const userId of selectedUsersForMassAction) {
        await api.put(`/users/${userId}/attendance`, {
          status: massActionModal.status,
          message: massActionModal.message,
          analysisDate: dataAtual,
          adminName: adminRealName // Enviando o nome para o backend
        });
      }
      
      if (reportData && reportData.allUsers) {
        const updatedAllUsers = reportData.allUsers.map(u => 
          selectedUsersForMassAction.includes(u.id) ? {
            ...u,
            attendance_status: massActionModal.status,
            analysis_message: massActionModal.message,
            last_analysis_date: dataAtual
          } : u
        );
        setReportData({ ...reportData, allUsers: updatedAllUsers });
      }

      alert(`Status de ${selectedUsersForMassAction.length} beneficiário(s) atualizado com sucesso!`);
      setMassActionModal({ isOpen: false, status: 'active', message: '' });
      setSelectedUsersForMassAction([]);
    } catch (error) {
      alert("Ocorreu um erro ao atualizar. Certifique-se que o Backend (userRoutes e userController) foi atualizado.");
    } finally {
      setIsMassUpdating(false);
    }
  };

  const handleOpenUserProfile = async (user) => {
    setSelectedUserProfile(user);
    setIsUserProfileOpen(true);
    setLoadingUserProofs(true);
    try {
      const profileRes = await api.get(`/users/${user.id}/details`);
      const detailedUser = {
        ...profileRes.data.usuario,
        dependents: profileRes.data.dependentes || [],
        status_history: profileRes.data.status_history || [],
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
    } catch (error) { setUserProofs([]); } finally { setLoadingUserProofs(false); }
  };

  const generateComprehensiveReport = async () => {
    if (!reportData || !reportData.allUsers) return;
    
    const dataToExport = reportData.allUsers.filter(u => {
      let mDate = true, mGender = true, mEdu = true, mRace = true;
      if (reportFilters.startDate) mDate = mDate && new Date(u.created_at) >= new Date(reportFilters.startDate);
      if (reportFilters.endDate) {
        const end = new Date(reportFilters.endDate); end.setDate(end.getDate() + 1);
        mDate = mDate && new Date(u.created_at) < end;
      }
      if (reportFilters.gender !== 'all') mGender = u.gender && u.gender.toLowerCase() === reportFilters.gender.toLowerCase();
      if (reportFilters.education !== 'all') mEdu = u.education_level === reportFilters.education;
      if (reportFilters.race !== 'all') mRace = u.race && u.race.toLowerCase() === reportFilters.race.toLowerCase();
      return mDate && mGender && mEdu && mRace;
    });

    let totalDependents = 0, famWithDependents = 0, waterAccess = 0, sanitationAccess = 0, electricityAccess = 0, totalCirculation = 0;
    const genderStats = {}, roomsStats = {}, housingStats = {}, raceStats = {}, statusStats = { 'active': 0, 'inactive': 0, 'justified': 0 };

    dataToExport.forEach(u => {
      totalCirculation += parseInt(u.seal_balance || 0, 10);
      
      const g = u.gender || 'Não Informado'; genderStats[g] = (genderStats[g] || 0) + 1;
      const r = u.rooms_count || 'Não Informado'; roomsStats[r] = (roomsStats[r] || 0) + 1;
      const h = u.housing_type || 'Não Informado'; housingStats[h] = (housingStats[h] || 0) + 1;
      const ra = u.race || 'Não Informado'; raceStats[ra] = (raceStats[ra] || 0) + 1;
      const st = u.attendance_status || 'active'; statusStats[st] = (statusStats[st] || 0) + 1;

      if(u.has_water) waterAccess++;
      if(u.has_sanitation) sanitationAccess++;
      if(u.has_electricity) electricityAccess++;

      const deps = parseInt(u.dependents_count || 0, 10);
      totalDependents += deps;
      if(deps > 0) famWithDependents++;
    });

    const doc = new jsPDF();
    const PRINT_DATE = new Date().toLocaleString('pt-BR');

    let base64Logo = null;
    if (ongLogoUrl) base64Logo = await fetchImageAsBase64(ongLogoUrl);

    const drawHeader = () => {
      if (base64Logo) {
        try { doc.addImage(base64Logo, 'PNG', 14, 10, 25, 25); } catch (e) {
          doc.setFontSize(12); doc.setTextColor(234, 88, 12); doc.text("SELO CIDADANIA", 14, 20);
        }
      } else {
        doc.setFontSize(12); doc.setTextColor(234, 88, 12); doc.setFont("helvetica", "bold"); doc.text("SELO CIDADANIA", 14, 20); doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`OSC: ${ongName}`, 196, 15, { align: 'right' });
      doc.text(`Data de Emissão: ${PRINT_DATE}`, 196, 20, { align: 'right' });
    };

    drawHeader();
    doc.setFontSize(16); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(`Relatório Geral de Impacto e Demografia`, 105, 38, { align: 'center' });
    doc.setFont("helvetica", "normal");

    autoTable(doc, {
      startY: 50, head: [['Métricas Principais do Grupo Filtrado', 'Valores']],
      body: [
        ['Famílias / Beneficiários', dataToExport.length.toString()],
        ['Total de Dependentes (Estimado)', totalDependents.toString()],
        ['Famílias com Dependentes', famWithDependents.toString()],
        ['Beneficiários Ativos (Status)', statusStats['active'].toString()],
        ['Beneficiários Inativos (Status)', statusStats['inactive'].toString()],
        ['Selos em Circulação neste grupo', totalCirculation.toString()]
      ],
      theme: 'grid', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold' } }
    });

    const genderBody = Object.keys(genderStats).map(k => [k, genderStats[k]]);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [['Distribuição por Gênero', 'Quantidade']], body: genderBody.length > 0 ? genderBody : [['Sem dados', '']], theme: 'grid', headStyles: { fillColor: [153, 27, 27] }});

    const raceBody = Object.keys(raceStats).map(k => [k, raceStats[k]]);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [['Distribuição por Etnia / Raça', 'Quantidade']], body: raceBody.length > 0 ? raceBody : [['Sem dados', '']], theme: 'grid', headStyles: { fillColor: [234, 88, 12] }});

    const housingBody = Object.keys(housingStats).map(k => [k, housingStats[k]]);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [['Tipos de Habitação', 'Quantidade']], body: housingBody.length > 0 ? housingBody : [['Sem dados', '']], theme: 'grid', headStyles: { fillColor: [153, 27, 27] }});

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10, head: [['Infraestrutura Básica', 'Famílias com Acesso']],
      body: [['Água Encanada', waterAccess.toString()], ['Saneamento Básico', sanitationAccess.toString()], ['Energia Elétrica', electricityAccess.toString()]],
      theme: 'grid', headStyles: { fillColor: [22, 163, 74] } 
    });

    doc.addPage(); drawHeader();
    doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(`Lista de Beneficiários Filtrados`, 14, 38);
    
    const userRows = dataToExport.map(u => [
      u.name, u.cpf || 'N/A', u.gender || '-', u.attendance_status === 'inactive' ? 'Inativo' : 'Ativo', u.seal_balance, formatDateOnly(u.created_at)
    ]);
    autoTable(doc, {
      startY: 45, head: [['Nome', 'CPF', 'Gênero', 'Status', 'Saldo', 'Cadastro']],
      body: userRows.length > 0 ? userRows : [['Nenhum beneficiário', '', '', '', '', '']],
      theme: 'striped', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 8 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages} - Sistema Selo Cidadania`, 105, 285, { align: 'center' });
    }

    doc.save(`Relatorio_Estatistico_${ongName.replace(/ /g, '_')}.pdf`);
    setIsReportModalOpen(false);
  };

  const handleDownloadUserDossier = async () => {
    if (!selectedUserProfile) return;
    const doc = new jsPDF();
    const p = selectedUserProfile;
    const PRINT_DATE = new Date().toLocaleString('pt-BR');

    let base64Logo = null;
    if (ongLogoUrl) base64Logo = await fetchImageAsBase64(ongLogoUrl);

    const drawHeader = () => {
      if (base64Logo) {
        try { doc.addImage(base64Logo, 'PNG', 14, 10, 25, 25); } catch (e) {
          doc.setFontSize(12); doc.setTextColor(234, 88, 12); doc.text("SELO CIDADANIA", 14, 20);
        }
      } else {
        doc.setFontSize(12); doc.setTextColor(234, 88, 12); doc.setFont("helvetica", "bold"); doc.text("SELO CIDADANIA", 14, 20); doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`OSC: ${ongName}`, 196, 15, { align: 'right' });
      doc.text(`Data: ${PRINT_DATE}`, 196, 20, { align: 'right' });
    };

    drawHeader();
    doc.setFontSize(18); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(`Dossiê do Beneficiário`, 105, 35, { align: 'center' });
    doc.setFontSize(14); doc.text(p.name, 105, 43, { align: 'center' });
    doc.setFont("helvetica", "normal");

    const formattedAddress = p.logradouro ? `${p.logradouro}, nº ${p.numero}${p.complemento ? ' (' + p.complemento + ')' : ''}, ${p.bairro}, ${p.cidade}/${p.estado}. CEP: ${p.cep}` : 'Endereço não cadastrado.';

    autoTable(doc, {
      startY: 50, head: [['Identificação e Contato', '']],
      body: [
        ['CPF / RG', `${p.cpf || 'N/I'} / ${p.rg || 'N/I'}`],
        ['Data de Nascimento / Etnia', `${formatDateOnly(p.birth_date)} | ${p.race || 'N/I'}`],
        ['E-mail / Telefone', `${p.email || 'N/I'} | ${p.phone || 'N/I'}`],
        ['Endereço', formattedAddress] 
      ],
      theme: 'grid', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8, head: [['Resumo Financeiro de Selos', '']],
        body: [
          ['Total de Selos Adquiridos (Histórico)', p.total_earned_seals || p.seal_balance || '0'],
          ['Selos Utilizados (Resgates)', p.used_seals || '0'],
          ['Saldo Atual em Carteira', p.seal_balance || '0']
        ],
        theme: 'grid', headStyles: { fillColor: [153, 27, 27] }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8, head: [['Mapeamento Social e Habitacional', '']],
        body: [
          ['Tamanho da Família / Cômodos', `${p.household_size || '-'} pessoas / ${p.rooms_count || '-'} cômodos`],
          ['Infraestrutura Básica', `Água: ${p.has_water ? 'Sim':'Não'} | Esgoto: ${p.has_sanitation ? 'Sim':'Não'} | Luz: ${p.has_electricity ? 'Sim':'Não'}`],
          ['Situação de Trabalho / Renda', `${p.employment_status || '-'} / R$ ${p.family_income || '-'}`],
          ['Cursos / PCD', `Cursos: ${p.course_interest || 'N/I'} | PCD: ${p.pcd || 'N/I'}`],
          ['Benefícios Sociais', Array.isArray(p.social_benefits) ? p.social_benefits.join(', ') : 'N/I']
        ],
        theme: 'grid', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
      });

    const statusBody = (p.status_history || []).map(s => [formatDateTime(s.created_at), s.status === 'inactive' ? 'Inativo' : s.status === 'justified' ? 'Justificado' : 'Ativo', s.admin_name || 'Sistema', s.message || '-']);
    if(statusBody.length > 0) {
      autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Data Alteração', 'Novo Status', 'Administrador', 'Motivo / Observação']], body: statusBody, theme: 'grid', headStyles: { fillColor: [71, 85, 105] }, styles: { fontSize: 8 }});
    }

    const depsBody = (p.dependents || []).map(d => [d.full_name || d.name, formatDateOnly(d.birth_date), d.cpf || '-', d.kinship || '-']);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Dependentes', 'Data Nascimento', 'CPF', 'Parentesco']], body: depsBody.length > 0 ? depsBody : [['Nenhum dependente.', '', '', '']], theme: 'grid', headStyles: { fillColor: [153, 27, 27] }, styles: { fontSize: 9 }});

    const proofsBody = userProofs.map(pr => [pr.title, formatDateOnly(pr.created_at), pr.status === 'approved' ? 'Aprovada' : pr.status === 'rejected' ? 'Rejeitada' : 'Pendente', pr.evaluator_name || '-']);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Atividade/Prova Social', 'Data Envio', 'Status', 'Avaliador']], body: proofsBody.length > 0 ? proofsBody : [['Nenhuma prova social enviada.', '', '', '']], theme: 'grid', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 8 }});

    const userRedemptions = reportData?.allRedemptions ? reportData.allRedemptions.filter(r => r.user_id === p.id) : [];
    const redemptionsBody = userRedemptions.map(r => [r.prize_name, formatDateOnly(r.redemption_date), `-${r.seals_redeemed} Selos`]);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Histórico de Resgates', 'Data do Resgate', 'Custo em Selos']], body: redemptionsBody.length > 0 ? redemptionsBody : [['Nenhum resgate.', '', '']], theme: 'grid', headStyles: { fillColor: [153, 27, 27] }, styles: { fontSize: 9 }});

    doc.save(`Dossie_${p.name.replace(/ /g, '_')}.pdf`);
  };

  const filteredLogs = auditLogs.filter(log => {
    const term = auditSearchTerm.toLowerCase();
    return ((log.sender_name && log.sender_name.toLowerCase().includes(term)) || (log.activity_title && log.activity_title.toLowerCase().includes(term)) || (log.evaluator_name && log.evaluator_name.toLowerCase().includes(term)));
  });

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const userName = log.sender_name || 'Utilizador Desconhecido';
    if (!acc[userName]) acc[userName] = [];
    acc[userName].push(log);
    return acc;
  }, {});

  const sortedLogUsers = Object.keys(groupedLogs).sort((a, b) => a.localeCompare(b));

  if (loading && !reportData) return <ContentWrapper title="Relatórios e Auditoria"><p>A carregar relatórios...</p></ContentWrapper>;

  const totalCirculation = parseInt(reportData?.generalStats?.totalSealsInCirculation || 0, 10);
  const totalRedeemed = parseInt(reportData?.generalStats?.totalSealsRedeemed || 0, 10);
  const totalEarned = totalCirculation + totalRedeemed; 

  const userRedemptions = selectedUserProfile && reportData?.allRedemptions ? reportData.allRedemptions.filter(r => r.user_id === selectedUserProfile.id) : [];

  return (
    <ContentWrapper title="Relatórios e Auditoria">
      
      {reportData ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title={`Métricas Gerais: ${ongName}`}>
              
              <div className={styles.generalPrintHeader}>
                <p>Resumo de selos e de Atividades da Organização</p>
                <Button onClick={() => setIsReportModalOpen(true)} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                  📊 Configurar e Imprimir Relatório Geral
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
            <ReportSection title="Dossiê de Beneficiários e Gestão de Status">
              <div className={styles.filterSection}>
                <div className={styles.searchRow}>
                  <div style={{ flex: 1 }}>
                    <InputField label="Pesquisa Direta" name="search" placeholder="Nome, CPF ou ID exato..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
                  </div>
                  
                  <div className={styles.filterGroup}>
                     <label className={styles.filterLabel}>Filtro de Status</label>
                     <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Todos os Status</option>
                        <option value="active">🟢 Apenas Ativos</option>
                        <option value="inactive">🔴 Apenas Inativos</option>
                        <option value="justified">🔵 Apenas Justificados</option>
                     </select>
                  </div>

                  <div className={styles.filterGroup}>
                     <label className={styles.filterLabel}>Ordenar por</label>
                     <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="name_asc">Nome (A-Z)</option>
                        <option value="name_desc">Nome (Z-A)</option>
                        <option value="seals_desc">Maior Saldo</option>
                        <option value="seals_asc">Menor Saldo</option>
                     </select>
                  </div>
                  <div className={styles.filterGroup}>
                     <label className={styles.filterLabel}>Filtro de Selos</label>
                     <select className={styles.filterSelect} value={filterSeals} onChange={(e) => setFilterSeals(e.target.value)}>
                        <option value="all">Todos</option><option value="with">COM Selos</option><option value="without">SEM Selos</option>
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
                  <div className={styles.resultsCount}>Exibindo <strong>{processedUsers.length}</strong> beneficiário(s)</div>
                </div>
              </div>
              
              {processedUsers.length > 0 && (
                <div className={styles.massActionBar}>
                  <label className={styles.massActionLabel}>
                    <input 
                      type="checkbox" className={styles.massCheckboxLg}
                      checked={selectedUsersForMassAction.length === processedUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUsersForMassAction(processedUsers.map(u => u.id));
                        else setSelectedUsersForMassAction([]);
                      }}
                    />
                    Selecionar Todos
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

              <div className={styles.groupedListContainer}>
                {processedUsers.length > 0 ? processedUsers.map(user => {
                  let dotClass = styles.dotGreen; 
                  const currentStatus = user.attendance_status || 'active';
                  
                  if (currentStatus === 'inactive') dotClass = styles.dotRed;
                  else if (currentStatus === 'justified') dotClass = styles.dotBlue;

                  return (
                  <div key={user.id} className={styles.userListItemClickable} onClick={() => handleOpenUserProfile(user)}>
                    <div className={styles.userMainInfo}>
                      <input 
                        type="checkbox" className={styles.massCheckbox}
                        checked={selectedUsersForMassAction.includes(user.id)} onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if(e.target.checked) setSelectedUsersForMassAction([...selectedUsersForMassAction, user.id]);
                          else setSelectedUsersForMassAction(selectedUsersForMassAction.filter(id => id !== user.id));
                        }}
                      />
                      <div style={{ position: 'relative' }}>
                        <span className={styles.userAvatarSm}>{user.name.charAt(0).toUpperCase()}</span>
                        <span className={`${styles.statusDotAbsolute} ${dotClass}`}></span>
                      </div>
                      <div>
                        <h4 className={styles.userNameTitle}>{user.name}</h4>
                        <span className={styles.userSubText}>CPF: {user.cpf || 'N/A'} | Status: {formatDateOnly(user.last_analysis_date || user.created_at)}</span>
                      </div>
                    </div>
                    <div className={styles.userStats}>
                      <div className={styles.statPill}><strong>{user.seal_balance}</strong> Selos</div>
                    </div>
                  </div>
                )}) : <p className={styles.emptyMessage}>Nenhum beneficiário encontrado.</p>}
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Auditoria de Provas Sociais e Atividades">
              <div className={styles.filterSection} style={{ marginBottom: '20px' }}>
                <InputField label="Filtrar Histórico" placeholder="Pesquisar por nome, atividade ou avaliador..." value={auditSearchTerm} onChange={(e) => setAuditSearchTerm(e.target.value)} />
              </div>

              <div className={styles.groupedListContainer}>
                {loadingAudit ? <p className={styles.loadingText}>A carregar auditoria...</p> : sortedLogUsers.length > 0 ? (
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
                            <div className={styles.logHeader}><h5>{log.activity_title} <span className={styles.sealBadge}>+{log.seal_value} Selos</span></h5></div>
                            <div className={styles.logBody}>
                              <div className={styles.logRow}><span><strong>Enviado em:</strong> {formatDateTime(log.sent_at)}</span></div>
                              <div className={styles.logRow}>
                                <span><strong>Avaliador:</strong> {log.evaluator_name || 'Automático'}</span>
                                <span><strong>Data:</strong> {formatDateTime(log.evaluated_at)}</span>
                              </div>
                            </div>
                            <div className={styles.logFooter}>
                              <span className={log.status === 'approved' ? styles.statusApproved : styles.statusRejected}>{log.status === 'approved' ? 'Aprovada' : 'Rejeitada'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : <p className={styles.emptyMessage}>Nenhum registo de avaliação encontrado.</p>}
              </div>
            </ReportSection>
          </div>
        </>
      ) : (!loading && <p className={styles.emptyMessage}>Não foi possível carregar os dados.</p>)}

      {/* ========================================================= */}
      {/* MODAL CONFIGURAÇÃO RELATÓRIO GERAL                        */}
      {/* ========================================================= */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Configurar Relatório Geral (Estatísticas)">
        <div className={styles.modalContainer}>
          <p className={styles.modalDescription}>Defina os filtros abaixo. O PDF gerado incluirá gráficos e totais com base na sua seleção.</p>
          
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label>Data de Início do Cadastro</label>
              <input type="date" value={reportFilters.startDate} onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})} />
            </div>
            <div className={styles.inputGroup}>
              <label>Data de Fim do Cadastro</label>
              <input type="date" value={reportFilters.endDate} onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})} />
            </div>
          </div>
          
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label>Gênero</label>
              <select value={reportFilters.gender} onChange={(e) => setReportFilters({...reportFilters, gender: e.target.value})}>
                <option value="all">Todos os Gêneros</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Etnia / Raça</label>
              <select value={reportFilters.race} onChange={(e) => setReportFilters({...reportFilters, race: e.target.value})}>
                <option value="all">Todas as Raças</option>
                <option value="Branca">Branca</option>
                <option value="Preta">Preta</option>
                <option value="Parda">Parda</option>
                <option value="Amarela">Amarela</option>
                <option value="Indígena">Indígena</option>
              </select>
            </div>
          </div>
          
          <div className={styles.inputGroup}>
              <label>Escolaridade</label>
              <select value={reportFilters.education} onChange={(e) => setReportFilters({...reportFilters, education: e.target.value})}>
                <option value="all">Todas</option>
                <option value="Fundamental Incompleto">Fundamental Incompleto</option>
                <option value="Fundamental Completo">Fundamental Completo</option>
                <option value="Médio Incompleto">Médio Incompleto</option>
                <option value="Médio Completo">Médio Completo</option>
                <option value="Superior Incompleto">Superior Incompleto</option>
                <option value="Superior Completo">Superior Completo</option>
              </select>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>Cancelar</Button>
            <Button onClick={generateComprehensiveReport} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>🖨️ Gerar PDF Completo</Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL AÇÃO EM MASSA (MUDANÇA DE STATUS)                   */}
      {/* ========================================================= */}
      <Modal isOpen={massActionModal.isOpen} onClose={() => setMassActionModal({ isOpen: false, status: 'active', message: '' })} title="Alterar Status em Massa">
        <div className={styles.modalContainer}>
          <p className={styles.modalDescription}>Você está a alterar o status de <strong>{selectedUsersForMassAction.length} beneficiário(s)</strong>.</p>
          <form onSubmit={handleMassStatusUpdate}>
            <div className={styles.statusOptions} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <label className={styles.statusOption}><input type="radio" name="status" value="active" checked={massActionModal.status === 'active'} onChange={(e) => setMassActionModal({...massActionModal, status: e.target.value})} /> Ativo</label>
              <label className={styles.statusOption}><input type="radio" name="status" value="inactive" checked={massActionModal.status === 'inactive'} onChange={(e) => setMassActionModal({...massActionModal, status: e.target.value})} /> Inativo</label>
              <label className={styles.statusOption}><input type="radio" name="status" value="justified" checked={massActionModal.status === 'justified'} onChange={(e) => setMassActionModal({...massActionModal, status: e.target.value})} /> Justificada</label>
            </div>
            <div className={styles.inputGroup}>
              <label>Motivo da Alteração em Massa *</label>
              <textarea rows="3" className={styles.textareaField} required value={massActionModal.message} onChange={(e) => setMassActionModal({...massActionModal, message: e.target.value})} placeholder="Descreva o motivo..."></textarea>
            </div>
            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setMassActionModal({ isOpen: false, status: 'active', message: '' })}>Cancelar</Button>
              <Button type="submit" disabled={isMassUpdating} style={{ backgroundColor: '#991b1b', borderColor: '#991b1b' }}>{isMassUpdating ? 'A Salvar...' : 'Confirmar Alteração'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 360 DO USUÁRIO (DOSSIÊ COMPLETO)                    */}
      {/* ========================================================= */}
      {isUserProfileOpen && selectedUserProfile && (
        <div className={styles.customOverlay} onClick={() => setIsUserProfileOpen(false)}>
          <div className={styles.customModalLg} onClick={(e) => e.stopPropagation()}>
            <div className={styles.customModalHeader}>
              <div className={styles.modalHeaderTitle}><h3>Dossiê Completo</h3></div>
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
                <button className={styles.downloadBtn} onClick={handleDownloadUserDossier}>📥 Imprimir Relatório Oficial</button>
              </div>

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

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Dados Pessoais e Residenciais</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>CPF</span><span className={styles.infoValue}>{selectedUserProfile.cpf || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Data Nasc.</span><span className={styles.infoValue}>{formatDateOnly(selectedUserProfile.birth_date)}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Etnia/Raça</span><span className={styles.infoValue}>{selectedUserProfile.race || 'N/A'}</span></div>
                  <div className={styles.infoBlock} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>Endereço Completo</span>
                    <span className={styles.infoValue}>
                      {selectedUserProfile.logradouro ? `${selectedUserProfile.logradouro}, nº ${selectedUserProfile.numero}. ${selectedUserProfile.bairro}. CEP: ${selectedUserProfile.cep}` : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Histórico de Frequência e Status</h4>
                {selectedUserProfile.status_history && selectedUserProfile.status_history.length > 0 ? (
                  <div className={styles.tableResponsive}>
                    <table className={styles.dependentsTable}>
                      <thead><tr><th>Data da Alteração</th><th>Novo Status</th><th>Administrador</th><th>Observação / Motivo</th></tr></thead>
                      <tbody>
                        {selectedUserProfile.status_history.map((sh, idx) => (
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
                ) : <p className={styles.emptyTextSm}>Nenhum histórico encontrado para este utilizador.</p>}
              </div>

              <div className={styles.detailsCard}>
                <h4 className={styles.cardTitle}>Composição Familiar e Socioeconômica</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Pessoas na casa</span><span className={styles.infoValue}>{selectedUserProfile.household_size || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Escolaridade</span><span className={styles.infoValue}>{selectedUserProfile.education_level || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Situação Trabalho</span><span className={styles.infoValue}>{selectedUserProfile.employment_status || 'N/A'}</span></div>
                  <div className={styles.infoBlock}><span className={styles.infoLabel}>Renda Familiar</span><span className={styles.infoValue}>{selectedUserProfile.family_income ? `R$ ${selectedUserProfile.family_income}` : 'N/A'}</span></div>
                  
                  {/* NOVOS CAMPOS: PCD E CURSOS */}
                  <div className={styles.infoBlock} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>Interesse em Cursos de Capacitação</span>
                    <span className={styles.infoValue}>{selectedUserProfile.course_interest || 'Nenhum informado'}</span>
                  </div>
                  <div className={styles.infoBlock} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>Pessoa com Deficiência (PCD) na família?</span>
                    <span className={styles.infoValue}>{selectedUserProfile.pcd || 'Não / Não informado'}</span>
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