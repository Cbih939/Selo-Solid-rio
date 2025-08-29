import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [] });

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(response.data);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
      }
    };
    fetchOngs();
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = { ongId: selectedOng === 'all' ? undefined : selectedOng };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedOng]);

  // =====================================================================
  // CORREÇÃO PRINCIPAL: Garantir que 'data' seja sempre um array.
  // Se a API enviar null ou undefined, nós o convertemos para um array vazio.
  // =====================================================================
  const handleViewDetails = (title, data) => {
    setModalContent({ 
      title, 
      data: Array.isArray(data) ? data : [] 
    });
    setModalOpen(true);
  };

  const handlePrint = (title, data) => {
    if (!Array.isArray(data) || data.length === 0) return;
    const headers = Object.keys(data[0]).map(key => `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('');
    const tableContent = data.map(item => `<tr><td>${Object.values(item).join('</td><td>')}</td></tr>`).join('');
    const printContent = `<html>...</html>`; // (código de impressão omitido por brevidade)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <ContentWrapper title="Relatórios"><p>A carregar relatórios...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios">
      <div className={styles.filters}>
        <SelectField label="Filtrar por ONG" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
          <option value="all">Todas as ONGs</option>
          {Array.isArray(ongs) && ongs.map(ong => (
            <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
          ))}
        </SelectField>
      </div>

      {reportData && reportData.sealsReport && reportData.usersReport ? (
        <>
          <ReportSection title="Relatório de Selos">
            <div className={styles.sectionHeader}>
              <div className={styles.statCard} style={{backgroundColor: '#fef9c3'}}><p>Selos em Circulação</p><span>{reportData.sealsReport.sealsInCirculation}</span></div>
              <div className={styles.statCard} style={{backgroundColor: '#fee2e2'}}><p>Selos Resgatados</p><span>{reportData.sealsReport.redeemedCount}</span></div>
              <InputField label="Data de Início" type="date" />
              <InputField label="Data de Fim" type="date" />
            </div>
            <div className={styles.listsGrid}>
              <div>
                <h4>Beneficiários com mais selos <button className={styles.detailsButton} onClick={() => handleViewDetails('Beneficiários com mais selos', reportData.sealsReport.topUsers)}>Ver todos</button></h4>
                <ul className={styles.list}>
                  {Array.isArray(reportData.sealsReport.topUsers) && reportData.sealsReport.topUsers.map(user => (
                    <li key={user.name}><span>{user.name}</span><span>{user.seal_balance} selos</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Últimos Resgates <button className={styles.detailsButton} onClick={() => handleViewDetails('Últimos Resgates', reportData.sealsReport.latestRedemptions)}>Ver todos</button></h4>
                <ul className={styles.list}>
                  {Array.isArray(reportData.sealsReport.latestRedemptions) && reportData.sealsReport.latestRedemptions.map(item => (
                     <li key={item.user_name + item.prize_name}>
                       <span>{item.user_name} resgatou <strong>{item.prize_name}</strong></span>
                       <span className={styles.date}>{new Date(item.redemption_date).toLocaleDateString('pt-BR')}</span>
                     </li>
                  ))}
                </ul>
              </div>
            </div>
          </ReportSection>

          <ReportSection title="Beneficiários Cadastrados">
             <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{backgroundColor: '#dbeafe'}}><p>Total de Beneficiários</p><span>{reportData.usersReport.totalUsers}</span></div>
                <InputField label="Filtrar por nome" placeholder="Nome do Beneficiário..." />
             </div>
          </ReportSection>
        </>
      ) : (
        !loading && <p>Não foi possível carregar os dados do relatório ou não há dados para a seleção atual.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <table>
            <thead>
              {/* Proteção extra: só renderiza o cabeçalho se houver dados */}
              {Array.isArray(modalContent.data) && modalContent.data.length > 0 && (
                <tr>
                  {Object.keys(modalContent.data[0]).map(key => <th key={key}>{key.replace(/_/g, ' ')}</th>)}
                </tr>
              )}
            </thead>
            <tbody>
              {/* ===================================================================== */}
              {/* CORREÇÃO SECUNDÁRIA: Proteção final dentro do JSX do modal. */}
              {/* ===================================================================== */}
              {Array.isArray(modalContent.data) && modalContent.data.map((item, index) => (
                <tr key={index}>
                  {Object.values(item).map((val, i) => <td key={`${index}-${i}`}>{String(val)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.printButtonContainer}>
            <Button variant="secondary" onClick={() => handlePrint(modalContent.title, modalContent.data)}>Imprimir</Button>
          </div>
        </div>
      </Modal>
    </ContentWrapper>
  );
};

export default ReportsPage;
