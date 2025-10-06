// Arquivo: pages/OngReportsPage/OngReportsPage.jsx (VERSÃO FINAL E COMPLETA)

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

// Função para formatar a data, corrigindo problemas de fuso horário
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);
  return correctedDate.toLocaleDateString('pt-BR');
};

const OngReportsPage = ({ user }) => {
  const [reportData, setReportData] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

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
                </thead>
                <tbody>
                  {data.allUsers?.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}  
{u.phone}</td>
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

//