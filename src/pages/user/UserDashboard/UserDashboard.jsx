import React, { useState, useEffect } from 'react';
import styles from './UserDashboard.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import api from '../../../api/api';

const UserDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState({
    seal_balance: 0,
    recent_proofs: []
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name);

          // Buscar dados atualizados do utilizador (para ter o saldo real)
          const res = await api.get(`/users/${user.id}`);
          
          // Buscar as últimas provas sociais
          const proofsRes = await api.get(`/proofs/user/${user.id}`);
          
          setDashboardData({
            seal_balance: res.data.seal_balance || 0,
            recent_proofs: proofsRes.data.slice(0, 5) // Mostra apenas as 5 mais recentes
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'approved': return { label: 'Aprovada', cls: styles.statusApproved };
      case 'rejected': return { label: 'Rejeitada', cls: styles.statusRejected };
      case 'needs_correction': return { label: 'Requer Correção', cls: styles.statusWarning };
      default: return { label: 'Pendente', cls: styles.statusPending };
    }
  };

  if (loading) {
    return <ContentWrapper title="Dashboard"><p className={styles.loadingText}>A carregar o seu painel...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Dashboard">
      <div className={styles.container}>
        
        <div className={styles.welcomeSection}>
          <h2>Olá, {userName}! 👋</h2>
          <p>Bem-vindo(a) ao seu painel de controlo. Acompanhe os seus selos e participe em novas atividades.</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCardPrimary}>
            <div className={styles.statInfo}>
              <h3>Meu Saldo de Selos</h3>
              <span className={styles.statValue}>{dashboardData.seal_balance}</span>
            </div>
            <button className={styles.actionBtnWhite} onClick={() => onNavigate('my_balance')}>
              Ver Carteira
            </button>
          </div>
          
          <div className={styles.statCardSecondary}>
            <div className={styles.statInfo}>
              <h3>Nova Atividade</h3>
              <p>Tem um novo comprovativo?</p>
            </div>
            <button className={styles.actionBtnPrimary} onClick={() => onNavigate('send_social_proof')}>
              Enviar Prova Social
            </button>
          </div>
        </div>

        <div className={styles.recentSection}>
          <div className={styles.recentHeader}>
            <h3>Atividades Recentes</h3>
            <button className={styles.linkBtn} onClick={() => onNavigate('my_social_proofs')}>
              Ver todo o histórico ➔
            </button>
          </div>

          {dashboardData.recent_proofs.length > 0 ? (
            <div className={styles.recentList}>
              {dashboardData.recent_proofs.map(proof => {
                const status = getStatusDisplay(proof.status);
                return (
                  <div key={proof.id} className={styles.recentItem}>
                    <div className={styles.recentItemInfo}>
                      <strong>{proof.title}</strong>
                      <span className={styles.date}>
                        Enviado em: {new Date(proof.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className={`${styles.statusBadge} ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className={styles.emptyState}>
               <p>Ainda não enviou nenhuma prova social.</p>
               <button className={styles.actionBtnOutline} onClick={() => onNavigate('send_social_proof')}>
                 Começar Agora
               </button>
             </div>
          )}
        </div>
        
      </div>
    </ContentWrapper>
  );
};

export default UserDashboard;