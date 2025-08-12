import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportCard from '../../../components/ui/ReportCard/ReportCard';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reports/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleViewRedemptions = async () => {
    try {
      const response = await api.get('/reports/redemptions');
      setRedemptions(response.data);
      setModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes dos resgates:", error);
    }
  };

  const handlePrint = () => {
    let printContent = `
      <html><head><title>Relatório de Resgates</title>
      <style>
        body { font-family: sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
      </head><body>
      <h1>Relatório de Resgates Efetuados</h1>
      <table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Prêmio Resgatado</th>
            <th>Data do Resgate</th>
          </tr>
        </thead>
        <tbody>
    `;
    redemptions.forEach(item => {
      printContent += `
        <tr>
          <td>${item.user_name}</td>
          <td>${item.prize_name}</td>
          <td>${new Date(item.redemption_date).toLocaleDateString('pt-BR')}</td>
        </tr>
      `;
    });
    printContent += '</tbody></table></body></html>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <ContentWrapper title="Relatórios do Sistema"><p>A carregar estatísticas...</p></ContentWrapper>;
  }

  if (!stats) {
    return <ContentWrapper title="Relatórios do Sistema"><p>Não foi possível carregar as estatísticas.</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios do Sistema">
      <div className={styles.grid}>
        <ReportCard title="Total de Usuários (Comuns)" value={stats.totalRegularUsers} />
        <ReportCard title="Total de ONGs" value={stats.totalOngs} />
        <ReportCard title="Admins Nv.1" value={stats.totalAdmins1} />
        <ReportCard title="Admins Nv.5" value={stats.totalAdmins5} />
        <ReportCard title="Total de Selos em Circulação" value={stats.sealsInCirculation} />
        
        {/* Card de Resgates com botão integrado */}
        <div className={styles.cardWithButton}>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Total de Resgates Efetuados</h3>
            <p className={styles.cardValue}>{stats.totalRedemptions}</p>
          </div>
          <Button onClick={handleViewRedemptions} className={styles.detailsButton}>Ver Detalhes</Button>
        </div>
      </div>

      {/* Modal de Detalhes dos Resgates */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Histórico de Resgates">
        <div className={styles.modalContent}>
          <ul className={styles.redemptionList}>
            {redemptions.map((item, index) => (
              <li key={index} className={styles.redemptionItem}>
                <span className={styles.userName}>{item.user_name}</span>
                <span className={styles.prizeName}>{item.prize_name}</span>
                <span className={styles.date}>{new Date(item.redemption_date).toLocaleDateString('pt-BR')}</span>
              </li>
            ))}
          </ul>
          <div className={styles.printButtonContainer}>
            <Button variant="secondary" onClick={handlePrint}>Imprimir Lista</Button>
          </div>
        </div>
      </Modal>
    </ContentWrapper>
  );
};

export default ReportsPage;