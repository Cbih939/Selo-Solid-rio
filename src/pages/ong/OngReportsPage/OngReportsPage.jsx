// Arquivo: OngReportsPage.jsx (Versão Final com o Layout de Grid)

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

const OngReportsPage = ({ user }) => {
  // ... (toda a sua lógica de useState, useEffect e funções handle... permanece a mesma)
  const [reportData, setReportData] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  useEffect(() => {
    if (!user || !user.ong_id) {
      setLoading(false);
      return;
    }
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = {
          ongId: user.ong_id,
          userSearch: userSearchTerm || undefined
        };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios da ONG:", error);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };
    const debounceFetch = setTimeout(() => {
        fetchReportData();
    }, 300);
    return () => clearTimeout(debounceFetch);
  }, [user, userSearchTerm]);

  const handleViewDetails = (title, data, headers) => {
    setModalContent({ title, data: Array.isArray(data) ? data : [], headers });
    setModalOpen(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    const tableColumn = modalContent.headers.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => item[header] ?? ''));
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
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
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
    return <ContentWrapper title="Relatórios da ONG"><p>A carregar relatórios...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios da ONG">
      {reportData ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Relatório de Selos">
              {/* ### APLICAÇÃO DO LAYOUT DE GRID ### */}
              <div className={styles.grid}>
                {/* Item 1: Card de Selos em Circulação */}
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}>
                  <p>Selos em Circulação</p>
                  <span>{reportData.sealsReport?.sealsInCirculation || 0}</span>
                </div>
                
                {/* Item 2: Card de Selos Resgatados */}
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}>
                  <p>Selos Resgatados</p>
                  <span>{reportData.sealsReport?.redeemedCount || 0}</span>
                </div>

                {/* Item 3: Card de Lista de Beneficiários */}
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Beneficiários com mais selos</h4>
                    <Button variant="primary" onClick={() => handleViewDetails('Beneficiários com Mais Selos', reportData.sealsReport?.allTopUsers, ['id', 'name', 'cpf', 'seal_balance', 'used_seals'])}>Ver todos</Button>
                  </div>
                  <ul className={styles.list}>
                    {reportData.sealsReport?.topUsers?.map(user => (
                      <li key={user.id}><span>{user.name}</span><span className={styles.highlight}>{user.seal_balance} selos</span></li>
                    ))}
                  </ul>
                </div>

                {/* Item 4: Card de Lista de Resgates */}
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Últimos Resgates</h4>
                    <Button variant="primary" onClick={() => handleViewDetails('Histórico de Resgates', reportData.sealsReport?.allRedemptions, ['user_id', 'user_name', 'user_cpf', 'redemption_date', 'prize_name', 'remaining_balance'])}>Ver todos</Button>
                  </div>
                  <ul className={styles.list}>
                    {reportData.sealsReport?.latestRedemptions?.map(item => (
                      <li key={item.id} className={styles.redemptionItem}>
                        <span><strong>{item.user_name}</strong> resgatou <strong>{item.prize_name}</strong></span>
                        <span className={styles.date}>{new Date(item.redemption_date).toLocaleString('pt-BR')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Beneficiários Cadastrados">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#dbeafe' }}>
                  <p>Total de Beneficiários</p>
                  <span>{reportData.usersReport?.totalUsers || 0}</span>
                </div>
                <InputField
                  label="Pesquisar Beneficiário"
                  placeholder="Nome ou CPF do beneficiário..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Selos em Circulação</th>
                      <th>Dependentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.usersReport?.usersList?.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.cpf}</td>
                        <td>{user.seal_balance}</td>
                        <td>{user.dependents_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          </div>
        </>
      ) : (
        <p>Não foi possível carregar as estatísticas.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <div className={styles.tableContainer}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  {modalContent.headers.map(key => <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>)}
                </tr>
              </thead>
              <tbody>
                {modalContent.data.map((item, index) => (
                  <tr key={index}>
                    {modalContent.headers.map(header => <td key={`${index}-${header}`}>{item[header]}</td>)}
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

export default OngReportsPage;
