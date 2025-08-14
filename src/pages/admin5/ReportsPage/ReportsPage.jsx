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
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedOng]);

  const handleViewDetails = (title, data) => {
    setModalContent({ title, data });
    setModalOpen(true);
  };

  const handlePrint = (title, data) => {
    let tableContent = data.map(item => `<tr><td>${Object.values(item).join('</td><td>')}</td></tr>`).join('');
    let printContent = `
      <html><head><title>${title}</title>
      <style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; }</style>
      </head><body><h1>${title}</h1>
      <table><tbody>${tableContent}</tbody></table>
      </body></html>`;
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
          {ongs.map(ong => (
            <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
          ))}
        </SelectField>
      </div>

      {reportData && (
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
                <h4>Usuários com mais selos <button className={styles.detailsButton} onClick={() => handleViewDetails('Usuários com mais selos', reportData.sealsReport.topUsers)}>Ver todos</button></h4>
                <ul className={styles.list}>
                  {reportData.sealsReport.topUsers.map(user => (
                    <li key={user.name}><span>{user.name}</span><span>{user.seal_balance} selos</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Últimos Resgates <button className={styles.detailsButton} onClick={() => handleViewDetails('Últimos Resgates', reportData.sealsReport.latestRedemptions)}>Ver todos</button></h4>
                <ul className={styles.list}>
                  {reportData.sealsReport.latestRedemptions.map(item => (
                     <li key={item.user_name + item.prize_name}>
                       <span>{item.user_name} resgatou <strong>{item.prize_name}</strong></span>
                       <span className={styles.date}>{new Date(item.redemption_date).toLocaleDateString('pt-BR')}</span>
                     </li>
                  ))}
                </ul>
              </div>
            </div>
          </ReportSection>

          <ReportSection title="Usuários Cadastrados">
             <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{backgroundColor: '#dbeafe'}}><p>Total de Usuários</p><span>{reportData.usersReport.totalUsers}</span></div>
                <InputField label="Filtrar por nome" placeholder="Nome do usuário..." />
             </div>
          </ReportSection>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          {/* Renderiza uma tabela simples com os dados do modal */}
          <table>
            <tbody>
              {modalContent.data.map((item, index) => (
                <tr key={index}>
                  {Object.values(item).map(val => <td key={val}>{val}</td>)}
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
