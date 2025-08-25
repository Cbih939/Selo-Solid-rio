import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportCard from '../../../components/ui/ReportCard/ReportCard';
import api from '../../../api/api';
import styles from './OngReportsPage.module.css';

const OngReportsPage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.ong_id) {
      const fetchStats = async () => {
        try {
          const response = await api.get(`/reports/ong/${user.ong_id}`);
          setStats(response.data);
        } catch (error) {
          console.error("Erro ao buscar estatísticas da ONG:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return <ContentWrapper title="Relatórios da ONG"><p>A carregar estatísticas...</p></ContentWrapper>;
  }

  if (!stats) {
    return <ContentWrapper title="Relatórios da ONG"><p>Não foi possível carregar as estatísticas.</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title={`Relatórios - ${user.ong_name}`}>
      <div className={styles.grid}>
        <ReportCard title="Total de Beneficiários da ONG" value={stats.totalUsers} />
        <ReportCard title="Selos em Circulação (Beneficiários da ONG)" value={stats.sealsInCirculation} />
        <ReportCard title="Resgates Efetuados (Beneficiários da ONG)" value={stats.totalRedemptions} />
      </div>
    </ContentWrapper>
  );
};

export default OngReportsPage;