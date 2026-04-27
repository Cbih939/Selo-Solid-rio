// Arquivo: src/pages/admin5/ReportsPage/ReportsPage.jsx

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
  dependents_count: 'Dependentes',
  logradouro: 'Arruamento/Rua', numero: 'Nº', complemento: 'Complemento',
  bairro: 'Bairro', cidade: 'Cidade', estado: 'UF', cep: 'CEP'
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
        console.error("Erro ao buscar dados dos relatórios:", error);
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
      const profileRes = await api.get(`/users/${user.id}/details`);
      const detailedUser = {
        ...profileRes.data.usuario,
        dependents: profileRes.data.dependentes || []
      };
      
      try {
          detailedUser.social_benefits = detailedUser.social_benefits ? JSON.parse(detailedUser.social_benefits) : [];
          detailedUser.public_services_access = detailedUser.public_services_access ? JSON.parse(detailedUser.public_services_access) : [];
          detailedUser.main_needs = detailedUser.main_needs ? JSON.parse(detailedUser.main_needs) : [];
      } catch(e) {}

      setSelectedUserProfile({ ...user, ...detailedUser });

      const response = await api.get(`/proofs/user/${user.id}`);
      setUserProofs(response.data);
    } catch (error) {
      console.error("Erro ao buscar provas do usuário:", error);
      setUserProofs([]);
    } finally {
      setLoadingUserProofs(false);
    }
  };

  const handleDownloadUserDossier = () => {
    if (!selectedUserProfile) return;
    const doc = new jsPDF();
    const p = selectedUserProfile;
    const PRINT_DATE_TIME = new Date().toLocaleString('pt-BR');

    const currentOngName = selectedOng === 'all' 
        ? 'Sistema Selo Cidadania (Visão Global)' 
        : ongs.find(o => o.id == selectedOng)?.fantasy_name || 'OSC Desconhecida';

    // Texto de Cabeçalho Livre de Imagens (Evita erro do LOGO_BASE64)
    doc.setFontSize(12); 
    doc.setTextColor(234, 88, 12); 
    doc.setFont("helvetica", "bold"); 
    doc.text("SELO CIDADANIA", 14, 20); 
    doc.setFont("helvetica", "normal");

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Organização: ${currentOngName}`, 196, 15, { align: 'right' });
    doc.text(`Relatório gerado em: ${PRINT_DATE_TIME}`, 196, 20, { align: 'right' });

    doc.setFontSize(18); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(`Relatório do Beneficiário`, 105, 35, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(p.name, 105, 43, { align: 'center' });
    doc.setFont("helvetica", "normal");

    const formattedAddress = p.logradouro ?
        `${p.logradouro}, nº ${p.numero}${p.complemento ? ' (' + p.complemento + ')' : ''}, ${p.bairro}, ${p.cidade}/${p.estado}. CEP: ${p.cep}`
        : 'Endereço não cadastrado.';

    autoTable(doc, {
      startY: 50, head: [['Identificação e Contato', '']],
      body: [
        ['CPF', p.cpf || 'Não informado'],
        ['RG', p.rg || 'Não informado'],
        ['Data de Nascimento', formatDateOnly(p.birth_date)],
        ['Nome da Mãe', p.mothers_name || 'Não informado'],
        ['Gênero / Orientação Sexual', `${p.gender || '-'} / ${p.sexual_orientation || '-'}`],
        ['E-mail', p.email || 'Não informado'],
        ['Telefone / WhatsApp', p.phone || 'Não informado'],
        ['Saldo Atual', `${p.seal_balance} Selos`],
        ['Endereço Cadastrado', formattedAddress]
      ],
      theme: 'grid', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8, head: [['Mapeamento Social e Habitacional', '']],
        body: [
          ['Tempo de Residência', p.residence_time || 'Não informado'],
          ['Tipo de Habitação', p.housing_type || 'Não informado'],
          ['Tamanho da Família / Cômodos', `${p.household_size || '-'} pessoas / ${p.rooms_count || '-'} cômodos`],
          ['Infraestrutura Básica', `Água: ${p.has_water ? 'Sim':'Não'} | Esgoto: ${p.has_sanitation ? 'Sim':'Não'} | Luz: ${p.has_electricity ? 'Sim':'Não'}`],
          ['Escolaridade', p.education_level || 'Não informado'],
          ['Situação de Trabalho / Renda', `${p.employment_status || '-'} / R$ ${p.family_income || '-'}`],
          ['Povos Tradicionais', p.traditional_community || 'Não'],
          ['Cursos / PCD', `Cursos: ${p.course_interest || 'N/I'} | PCD: ${p.pcd || 'N/I'}`],
          ['Benefícios Sociais', Array.isArray(p.social_benefits) ? p.social_benefits.join(', ') : 'Não informado'],
          ['Maiores Necessidades', Array.isArray(p.main_needs) ? p.main_needs.join(', ') : 'Não informado']
        ],
        theme: 'grid', headStyles: { fillColor: [153, 27, 27] }, styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
      });

    const deps = p.dependents || [];
    const dependentsBody = deps.map(d => [d.full_name || d.name, formatDateOnly(d.birth_date), d.cpf || '-', d.kinship || '-']);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8, head: [['Nome Dependente', 'Data Nascimento', 'CPF', 'Parentesco']],
      body: dependentsBody.length > 0 ? dependentsBody : [['Nenhum dependente cadastrado.', '', '', '']],
      theme: 'grid', headStyles: { fillColor: [234, 88, 12] }, styles: { fontSize: 9 }
    });

    const proofsBody = userProofs.map(proof => [
      proof.title, formatDateOnly(proof.created_at),
      proof.status === 'approved' ? 'Aprovada' : proof.status === 'rejected' ? 'Rejeitada' : 'Pendente',
      proof.evaluator_name || '-', proof.feedback_message || '-'
    ]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8, head: [['Atividade/Prova Social', 'Data Envio', 'Status', 'Avaliado por', 'Feedback']],
      body: proofsBody.length > 0 ? proofsBody : [['Nenhuma prova social enviada.', '', '', '', '']],
      theme: 'grid', headStyles: { fillColor: [71, 85, 105] }, styles: { fontSize: 8 }
    });

    const userRedemptions = reportData?.allRedemptions ? reportData.allRedemptions.filter(r => r.user_id === p.id) : [];
    const redemptionsBody = userRedemptions.map(r => [r.prize_name, formatDateOnly(r.redemption_date), `-${r.seals_redeemed} Selos`]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8, head: [['Custo/Resgate Realizado', 'Data do Resgate', 'Custo em Selos']],
      body: redemptionsBody.length > 0 ? redemptionsBody : [['Nenhum resgate efetuado.', '', '']],
      theme: 'grid', headStyles: { fillColor: [153, 27, 27] }, styles: { fontSize: 9 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages} - Relatório oficial gerado pelo Sistema Selo Cidadania`, 105, 285, { align: 'center' });
    }

    doc.save(`Relatorio_${p.name.replace(/ /g, '_')}.pdf`);
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

  if (loading && !reportData) {
    return (
      <ContentWrapper title="Relatórios e Auditoria Global">
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>A compilar os relatórios globais...</p>
        </div>
      </ContentWrapper>
    );
  }

  const userRedemptions = selectedUserProfile && data?.allRedemptions ? data.allRedemptions.filter(r => r.user_id === selectedUserProfile.id) : [];

  return (
    <ContentWrapper title="Relatórios e Auditoria Global">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Visão Geral do Sistema</h2>
        <p className={styles.introText}>
          Acompanhe métricas, pesquise beneficiários e audite as aprovações de selos. Use os filtros abaixo para analisar uma OSC específica ou visualizar o panorama global.
        </p>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchRow}>
          <div className={styles.filterGroup}>
            <InputField label="🔍 Buscar Instituição" placeholder="Digite o nome da OSC..." value={ongSearchTerm} onChange={(e) => setOngSearchTerm(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="Filtrar Dados por OSC" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
              <option value="all">🌐 Visão Global (Todas as OSCs)</option>
              {filteredOngs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
            </SelectField>
          </div>
        </div>
      </div>

      {data ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Métricas Financeiras e Sociais">
              <div className={styles.sectionHeaderStats}>
                <div className={styles.statCard} style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                  <p>Beneficiários Ativos</p>
                  <span style={{ color: '#0369a1' }}>{data.generalStats?.totalUsers || 0}</span>
                </div>
                <div className={styles.statCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <p>Selos em Circulação</p>
                  <span style={{ color: '#15803d' }}>{data.generalStats?.totalSealsInCirculation || 0}</span>
                </div>
                <div className={styles.statCard} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                  <p>Selos Resgatados</p>
                  <span style={{ color: '#b91c1c' }}>{data.generalStats?.totalSealsRedeemed || 0}</span>
                </div>
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Diretório de Beneficiários">
              <div className={styles.internalFilter}>
                <InputField label="🔍 Filtrar Beneficiários" placeholder="Nome, CPF ou E-mail..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
              </div>
              <div className={styles.groupedListContainer}>
                {sortedUsers.length > 0 ? sortedUsers.map(user => (
                  <div key={user.id} className={styles.userListItemClickable} onClick={() => handleOpenUserProfile(user)} title="Ver Dossiê Completo">
                    <div className={styles.userMainInfo}>
                      <span className={styles.userAvatarSm}>{user.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <h4 className={styles.userNameTitle}>{user.name}</h4>
                        <span className={styles.userSubText}>CPF: {user.cpf || 'N/A'} | Instituição: {user.ong_name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className={styles.userStats}>
                      <div className={styles.statPill}><strong>{user.seal_balance}</strong> Selos</div>
                      <div className={styles.statPillLight}><strong>{user.dependents_count || (user.dependents ? user.dependents.length : 0)}</strong> Dependente(s)</div>
                    </div>
                  </div>
                )) : <div className={styles.emptyState}><p>Nenhum beneficiário encontrado.</p></div>}
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Auditoria de Aprovações e Bônus">
              <div className={styles.internalFilter}>
                <InputField label="🔍 Filtrar Histórico" placeholder="Pesquisar por nome, OSC, atividade..." value={auditSearchTerm} onChange={(e) => setAuditSearchTerm(e.target.value)} />
              </div>
              <div className={styles.groupedListContainer}>
                {loadingAudit ? (
                  <div className={styles.loadingState}><p>A carregar registos de auditoria...</p></div>
                ) : sortedLogUsers.length > 0 ? sortedLogUsers.map(userName => (
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
                            <div className={styles.logRow}><span><strong>Data do Envio:</strong> {formatDateTime(log.sent_at)}</span></div>
                            <div className={styles.logRow}><span><strong>Autorizado por:</strong> {log.evaluator_name || 'Desconhecido'}</span><span><strong>Data da Avaliação:</strong> {formatDateTime(log.evaluated_at)}</span></div>
                            
                            {log.feedback_message && (
                              <div className={styles.feedbackBlock}>
                                <span><strong>Observação:</strong> {log.feedback_message}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.logFooter}>
                            <span className={log.status === 'approved' ? styles.statusApproved : styles.statusRejected}>{log.status === 'approved' ? 'Aprovada' : 'Rejeitada'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : <div className={styles.emptyState}><p>Nenhum registo de auditoria encontrado.</p></div>}
              </div>
            </ReportSection>
          </div>
        </>
      ) : (!loading && <div className={styles.emptyState}><p>Não existem dados para exibir.</p></div>)}

      {/* ++ VISÃO 360: DOSSIÊ DO BENEFICIÁRIO ++ */}
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
                    <p>Cadastrado desde: {formatDateOnly(selectedUserProfile.created_at)} | ID: {selectedUserProfile.id}</p>
                  </div>
                </div>
                <button className={styles.downloadBtn} onClick={handleDownloadUserDossier}>
                  📥 Imprimir Relatório PDF
                </button>
              </div>

              <div className={styles.profileGridLg}>
                
                <div className={styles.profileSideCol}>
                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Dados Pessoais e Residenciais</h4>
                    <ul className={styles.profileDataList}>
                      <li><strong>CPF:</strong> {selectedUserProfile.cpf || 'Não informado'}</li>
                      <li><strong>RG:</strong> {selectedUserProfile.rg || 'Não informado'}</li>
                      <li><strong>Nascimento:</strong> {formatDateOnly(selectedUserProfile.birth_date)}</li>
                      <li><strong>Nome da Mãe:</strong> {selectedUserProfile.mothers_name || 'Não informado'}</li>
                      <li><strong>E-mail:</strong> {selectedUserProfile.email || 'Não informado'}</li>
                      <li><strong>Telefone:</strong> {selectedUserProfile.phone || 'Não informado'}</li>
                      <hr className={styles.listDivider} />
                      <li>
                          <strong>Endereço Completo:</strong>
                          <span className={styles.addressSpan}>
                              {selectedUserProfile.logradouro ? 
                                `${selectedUserProfile.logradouro}, nº ${selectedUserProfile.numero}${selectedUserProfile.complemento ? ' ('+selectedUserProfile.complemento+')' : ''}. ${selectedUserProfile.bairro}. ${selectedUserProfile.cidade}/${selectedUserProfile.estado}. CEP: ${selectedUserProfile.cep}`
                                : 'Endereço não preenchido'}
                          </span>
                      </li>
                      <li><strong>Tempo no Local:</strong> {selectedUserProfile.residence_time || '-'}</li>
                      <li><strong>Tipo de Habitação:</strong> {selectedUserProfile.housing_type || '-'}</li>
                    </ul>
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Mapeamento Social</h4>
                    <ul className={styles.profileDataList}>
                      <li><strong>Moradores:</strong> {selectedUserProfile.household_size || '-'}</li>
                      <li><strong>Cômodos:</strong> {selectedUserProfile.rooms_count || '-'}</li>
                      <li><strong>Água / Saneamento:</strong> {selectedUserProfile.has_water ? 'Sim' : 'Não'} / {selectedUserProfile.has_sanitation ? 'Sim' : 'Não'}</li>
                      <li><strong>Energia Elétrica:</strong> {selectedUserProfile.has_electricity ? 'Sim' : 'Não'}</li>
                      <hr className={styles.listDivider} />
                      <li><strong>Escolaridade:</strong> {selectedUserProfile.education_level || '-'}</li>
                      <li><strong>Situação Profissional:</strong> {selectedUserProfile.employment_status || '-'}</li>
                      <li><strong>Renda Familiar Estimada:</strong> {selectedUserProfile.family_income ? `R$ ${selectedUserProfile.family_income}` : '-'}</li>
                      <li><strong>Comunidade Tradicional:</strong> {selectedUserProfile.traditional_community || 'Não'}</li>
                      <li><strong>Cursos / PCD:</strong> Cursos: {selectedUserProfile.course_interest || 'N/I'} | PCD: {selectedUserProfile.pcd || 'N/I'}</li>
                    </ul>
                    
                    <div className={styles.tagsContainer}>
                      <strong>Benefícios Sociais:</strong>
                      <div className={styles.pillsContainer}>
                        {Array.isArray(selectedUserProfile.social_benefits) && selectedUserProfile.social_benefits.length > 0 
                          ? selectedUserProfile.social_benefits.map(b => <span key={b} className={styles.pillItem}>{b}</span>) 
                          : <span className={styles.emptyTextSm}>Nenhum benefício associado</span>}
                      </div>
                    </div>
                    
                    <div className={styles.tagsContainer}>
                      <strong>Maiores Necessidades Declaradas:</strong>
                      <div className={styles.pillsContainer}>
                        {Array.isArray(selectedUserProfile.main_needs) && selectedUserProfile.main_needs.length > 0 
                          ? selectedUserProfile.main_needs.map(n => <span key={n} className={styles.pillItemAlert}>{n}</span>) 
                          : <span className={styles.emptyTextSm}>Não informado</span>}
                      </div>
                    </div>
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Composição Familiar ({selectedUserProfile.dependents?.length || 0})</h4>
                    {selectedUserProfile.dependents && selectedUserProfile.dependents.length > 0 ? (
                      <ul className={styles.dependentsList}>
                        {selectedUserProfile.dependents.map((dep, i) => (
                          <li key={i}>
                            <strong>{dep.name || dep.full_name}</strong>
                            <span>Nasc: {formatDateOnly(dep.birth_date)} | {dep.kinship || dep.relationship}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className={styles.emptyTextSm}>Nenhum dependente cadastrado.</p>}
                  </div>
                </div>

                <div className={styles.profileMainCol}>
                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Carteira e Saldo de Selos</h4>
                    <div className={styles.walletCardsRow}>
                      <div className={styles.walletCardActive}>
                        <span>Saldo Disponível</span>
                        <strong>{selectedUserProfile.seal_balance}</strong>
                      </div>
                      <div className={styles.walletCardUsed}>
                        <span>Total Usado / Resgatado</span>
                        <strong>{selectedUserProfile.used_seals || 0}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Histórico Financeiro (Resgates)</h4>
                    {userRedemptions.length > 0 ? (
                      <div className={styles.scrollableListSmall}>
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
                    ) : <p className={styles.emptyTextSm}>O beneficiário ainda não efetuou resgates.</p>}
                  </div>

                  <div className={styles.profileSectionWhite}>
                    <h4 className={styles.profileSectionTitle}>Auditoria de Provas Sociais ({userProofs.length})</h4>
                    {loadingUserProofs ? (
                      <p className={styles.emptyTextSm}>A carregar dados...</p>
                    ) : userProofs.length > 0 ? (
                      <div className={styles.scrollableListLarge}>
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
                                  <div className={styles.evalRow}><span><strong>Avaliado por:</strong> {proof.evaluator_name || 'Desconhecido'}</span><span><strong>Data:</strong> {formatDateTime(proof.evaluated_at)}</span></div>
                                  {proof.feedback_message && (
                                    <div className={styles.evalFeedback}>
                                      <strong>Obs:</strong> {proof.feedback_message}
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : <p className={styles.emptyTextSm}>O beneficiário não possui submissões.</p>}
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

export default ReportsPage;