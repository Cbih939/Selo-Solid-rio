// Arquivo: pages/ong/OngReportsPage/OngReportsPage.jsx (ATUALIZADO COM ESTATÍSTICAS E AUDITORIA)

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

// Dicionário de traduções para os cabeçalhos dos modais
const headerTranslations = {
 name: 'Nome',
 seal_balance: 'Saldo de Selos',
 user_name: 'Nome do Usuário',
 redemption_date: 'Data do Resgate',
 prize_name: 'Motivo do Resgate',
};
const translateHeader = (headerKey) => headerTranslations[headerKey] || headerKey;

// Função para formatar a data (apenas dia/mês/ano)
const formatDate = (dateString) => {
 if (!dateString) return 'N/A';
 const date = new Date(dateString);
 const userTimezoneOffset = date.getTimezoneOffset() * 60000;
 const correctedDate = new Date(date.getTime() + userTimezoneOffset);
 return correctedDate.toLocaleDateString('pt-BR');
};

// Função para formatar data e hora (usada na auditoria)
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const OngReportsPage = ({ user }) => {
 const [reportData, setReportData] = useState(null);
 const [userSearchTerm, setUserSearchTerm] = useState('');
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setModalOpen] = useState(false);
 const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

 // ++ NOVOS ESTADOS PARA A AUDITORIA ++
 const [auditLogs, setAuditLogs] = useState([]);
 const [auditSearchTerm, setAuditSearchTerm] = useState('');
 const [loadingAudit, setLoadingAudit] = useState(false);

 // Fetch dos Relatórios Gerais
 useEffect(() => {
  if (!user || !user.ong_id) { setLoading(false); return; }
  const fetchReportData = async () => {
   setLoading(true);
   try {
    const params = { ongId: user.ong_id, search: userSearchTerm || undefined };
    const response = await api.get('/reports', { params });
    setReportData(response.data);
   } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    setReportData(null);
   } finally { setLoading(false); }
  };
  const debounceFetch = setTimeout(() => { fetchReportData(); }, 300);
  return () => clearTimeout(debounceFetch);
 }, [user, userSearchTerm]);

 // ++ Fetch do Log de Auditoria ++
 useEffect(() => {
  if (!user || !user.ong_id) return;
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const response = await api.get(`/proofs/log/${user.ong_id}`);
      setAuditLogs(response.data);
    } catch (error) {
      console.error("Erro ao carregar o log de auditoria:", error);
    } finally {
      setLoadingAudit(false);
    }
  };
  fetchAuditLogs();
 }, [user]);

 const handleViewDetails = (title, data, headers) => {
  setModalContent({ title, data: Array.isArray(data) ? data : [], headers });
  setModalOpen(true);
 };

 const generatePDF = () => {
  if (!modalContent.data || modalContent.data.length === 0) return null;
  const doc = new jsPDF();
  doc.text(modalContent.title, 14, 16);
  const tableColumn = modalContent.headers.map(translateHeader);
  const tableRows = modalContent.data.map(item => modalContent.headers.map(header => {
    if (header === 'redemption_date') {
      return new Date(item[header]).toLocaleString('pt-BR');
    }
    return item[header] ?? '';
  }));
  autoTable(doc, { head: [tableColumn], body: tableRows, startY: 24 });
  return doc;
 };

 const handlePrint = () => {
  const doc = generatePDF();
  if (doc) {
   doc.autoPrint();
   window.open(doc.output('bloburl'), '_blank');
  }
 };

 const handleShare = async () => {
  const doc = generatePDF();
  if (!doc) return;
  const pdfFileName = `${modalContent.title.replace(/ /g, '_')}.pdf`;
  try {
   const pdfBlob = doc.output('blob');
   const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
   const shareData = { title: modalContent.title, text: `Confira o relatório: ${modalContent.title}`, files: [pdfFile] };
   if (navigator.share && navigator.canShare(shareData)) {
    await navigator.share(shareData);
   } else {
    doc.save(pdfFileName);
   }
  } catch (error) {
   console.error('Erro ao compartilhar:', error);
   doc.save(pdfFileName);
  }
 };

 // Filtro do Log de Auditoria
 const filteredLogs = auditLogs.filter(log => {
  const term = auditSearchTerm.toLowerCase();
  return (
    (log.sender_name && log.sender_name.toLowerCase().includes(term)) ||
    (log.activity_title && log.activity_title.toLowerCase().includes(term)) ||
    (log.evaluator_name && log.evaluator_name.toLowerCase().includes(term))
  );
 });

 if (loading) {
  return <ContentWrapper title="Meus Relatórios"><p>Carregando relatórios...</p></ContentWrapper>;
 }

 const data = reportData;

 return (
  <ContentWrapper title="Meus Relatórios">
   {data ? (
    <>
     {/* SEÇÃO DE ESTATÍSTICAS E RESGATES */}
     <ReportSection title="Visão Geral">
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ backgroundColor: '#dcfce7' }}>
         <p>Total de Beneficiários</p>
         <span>{data.generalStats?.totalUsers || 0}</span>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}>
         <p>Selos em Circulação</p>
         <span>{data.generalStats?.totalSealsInCirculation || 0}</span>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}>
         <p>Total de Resgates</p>
         <span>{data.generalStats?.totalSealsRedeemed || 0}</span>
        </div>
      </div>

      <div className={styles.listsGrid}>
       <div className={styles.listCard}>
        <div className={styles.listHeader}>
         <h4>Beneficiários com mais selos</h4>
         <Button variant="primary" onClick={() => handleViewDetails('Beneficiários com Mais Selos', data.topUsers, ['name', 'seal_balance'])}>Ver todos</Button>
        </div>
        <ul className={styles.list}>
         {data.topUsers?.slice(0, 5).map(u => (<li key={u.id}><span>{u.name}</span><span className={styles.highlight}>{u.seal_balance} selos</span></li>))}
        </ul>
       </div>
       <div className={styles.listCard}>
        <div className={styles.listHeader}>
         <h4>Últimos Resgates</h4>
         <Button variant="primary" onClick={() => handleViewDetails('Histórico de Resgates', data.allRedemptions, ['user_name', 'redemption_date', 'prize_name'])}>Ver todos</Button>
        </div>
        <ul className={styles.list}>
         {data.latestRedemptions?.map(item => (
          <li key={item.id} className={styles.redemptionItem}>
           <div>
            <span><strong>{item.user_name}</strong> resgatou:</span>
            <span className={styles.reason}>{item.prize_name}</span>
           </div>
           <span className={styles.date}>{new Date(item.redemption_date).toLocaleString('pt-BR')}</span>
          </li>
         ))}
        </ul>
       </div>
      </div>
     </ReportSection>

     {/* SEÇÃO DE BENEFICIÁRIOS COMPLETOS */}
     <ReportSection title="Relatório Completo de Beneficiários">
      <InputField
       label="Pesquisar Beneficiário"
       placeholder="Nome, CPF ou E-mail..."
       value={userSearchTerm}
       onChange={(e) => setUserSearchTerm(e.target.value)}
      />
      <div className={styles.tableContainer}>
       <table className={styles.reportTable}>
        <thead>
         <tr>
          <th>Nome</th>
          <th>Contato</th>
          <th>Documento</th>
          <th>Dependentes</th>
          <th>Selos</th>
         </tr>
         <tr>
          <th colSpan="5" style={{textAlign: 'right', fontSize: '0.8rem', color: '#666'}}>
           Total listado: {data.allUsers?.length || 0}
          </th>
         </tr>
        </thead>
        <tbody>
         {data.allUsers?.map(u => (
          <tr key={u.id}>
           <td>{u.name}</td>
           <td>{u.email} <br/> {u.phone}</td>
           <td>{u.cpf}</td>
           <td>{u.dependents.length > 0 ? (
            <ul>{u.dependents.map((d, i) => <li key={i}>{d.name} ({formatDate(d.birth_date)})</li>)}</ul>
           ) : 'Nenhum'}</td>
           <td>{u.seal_balance}</td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </ReportSection>

     {/* ++ NOVA SEÇÃO: HISTÓRICO DE AUDITORIA DE PROVAS SOCIAIS ++ */}
     <ReportSection title="Histórico de Avaliações (Provas Sociais)">
       <InputField
         label="Filtrar Histórico"
         placeholder="Pesquisar por nome do beneficiário, atividade ou avaliador..."
         value={auditSearchTerm}
         onChange={(e) => setAuditSearchTerm(e.target.value)}
       />
       <div className={styles.tableContainer}>
         {loadingAudit ? (
           <p style={{ padding: '20px', textAlign: 'center' }}>A carregar histórico de avaliações...</p>
         ) : (
           <table className={styles.reportTable}>
             <thead>
               <tr>
                 <th>Beneficiário</th>
                 <th>Atividade</th>
                 <th>Data do Envio</th>
                 <th>Status</th>
                 <th>Avaliado Por</th>
                 <th>Data da Avaliação</th>
               </tr>
             </thead>
             <tbody>
               {filteredLogs.length > 0 ? (
                 filteredLogs.map(log => (
                   <tr key={log.id}>
                     <td style={{ fontWeight: '600' }}>{log.sender_name}</td>
                     <td>
                       {log.activity_title} <br/>
                       <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 'bold' }}>
                         +{log.seal_value} Selos
                       </span>
                     </td>
                     <td style={{ fontSize: '0.9rem', color: '#64748b' }}>{formatDateTime(log.sent_at)}</td>
                     <td>
                       <span style={{
                         backgroundColor: log.status === 'approved' ? '#dcfce7' : '#fee2e2',
                         color: log.status === 'approved' ? '#166534' : '#991b1b',
                         padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                       }}>
                         {log.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                       </span>
                     </td>
                     <td>{log.evaluator_name || 'Desconhecido'}</td>
                     <td style={{ fontSize: '0.9rem', color: '#64748b' }}>{formatDateTime(log.evaluated_at)}</td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                     Nenhum registo de avaliação encontrado.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         )}
       </div>
     </ReportSection>

    </>
   ) : (
    <p>Não foi possível carregar as estatísticas.</p>
   )}
   
   {/* Modal para visualizar detalhes */}
   <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
    <div className={styles.modalContent}>
     <div className={styles.tableContainer}>
      <table className={styles.reportTable}>
       <thead>
        <tr>
         {modalContent.headers.map(key => <th key={key}>{translateHeader(key)}</th>)}
        </tr>
       </thead>
       <tbody>
        {modalContent.data.map((item, index) => (
         <tr key={index}>
          {modalContent.headers.map(header => <td key={`${index}-${header}`}>
           {header === 'redemption_date' ? new Date(item[header]).toLocaleString('pt-BR') : item[header]}
          </td>)}
         </tr>
        ))}
       </tbody>
      </table>
     </div>
     <div className={styles.modalActions}>
      <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
      <Button variant="primary" onClick={handleShare}>Compartilhar</Button>
     </div>
    </div>
   </Modal>
  </ContentWrapper>
 );
};

export default OngReportsPage;