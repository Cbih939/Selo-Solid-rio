import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState(''); // 'all' ou um ID de ONG
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a lista de ONGs para o filtro
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
    // Busca os dados dos relatórios sempre que o filtro de ONG mudar
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = {
          ongId: selectedOng === 'all' ? null : selectedOng,
        };
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
            <div className={styles.sealReportGrid}>
              <div className={styles.statCard} style={{backgroundColor: '#fef9c3'}}><p>Selos em Circulação</p><span>{reportData.sealsReport.sealsInCirculation}</span></div>
              <div className={styles.statCard} style={{backgroundColor: '#fee2e2'}}><p>Selos Resgatados</p><span>{reportData.sealsReport.redeemedCount}</span></div>
            </div>
            <div className={styles.listsGrid}>
              <div>
                <h4>Usuários com mais selos</h4>
                <ul className={styles.list}>
                  {reportData.sealsReport.topUsers.map(user => (
                    <li key={user.name}><span>{user.name}</span><span>{user.seal_balance} selos</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Últimos Resgates</h4>
                <ul className={styles.list}>
                  {reportData.sealsReport.latestRedemptions.map(item => (
                     <li key={item.user_name + item.prize_name}><span>{item.user_name} resgatou <strong>{item.prize_name}</strong></span></li>
                  ))}
                </ul>
              </div>
            </div>
          </ReportSection>

          <ReportSection title="Usuários Cadastrados">
             <div className={styles.statCard} style={{backgroundColor: '#dbeafe', width: 'fit-content'}}><p>Total de Usuários</p><span>{reportData.usersReport.totalUsers}</span></div>
          </ReportSection>
        </>
      )}
    </ContentWrapper>
  );
};

export default ReportsPage;