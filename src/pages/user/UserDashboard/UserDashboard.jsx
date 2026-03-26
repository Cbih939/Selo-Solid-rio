import React, { useState, useEffect } from 'react';
import styles from './UserDashboard.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import api from '../../../api/api';

const UserDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState({
    seal_balance: 0,
    recent_proofs: [],
    ongInfo: null // Novo estado para guardar as informações da OSC
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

          // Usamos a rota 'me/profile' que atualizámos no backend para trazer as redes sociais
          const res = await api.get(`/users/me/profile`);
          const proofsRes = await api.get(`/proofs/user/${user.id}`);
          
          setDashboardData({
            seal_balance: res.data.seal_balance || 0,
            recent_proofs: proofsRes.data.slice(0, 5),
            ongInfo: {
              name: res.data.ong_name,
              whatsapp: res.data.ong_whatsapp,
              instagram: res.data.ong_instagram,
              facebook: res.data.ong_facebook,
              website: res.data.ong_website
            }
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
      case 'approved': return { label: 'Aprovada', cls: styles.statusApproved, icon: '✅' };
      case 'rejected': return { label: 'Rejeitada', cls: styles.statusRejected, icon: '❌' };
      case 'needs_correction': return { label: 'Requer Correção', cls: styles.statusWarning, icon: '⚠️' };
      default: return { label: 'Em Análise', cls: styles.statusPending, icon: '⏳' };
    }
  };

  if (loading) {
    return <ContentWrapper title="Meu Painel"><div className={styles.loadingContainer}><p className={styles.loadingText}>A preparar o seu painel...</p></div></ContentWrapper>;
  }

  const { ongInfo } = dashboardData;

  // Função para limpar o WhatsApp e formatar o link da API do WhatsApp
  const getWhatsAppLink = (phone) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  return (
    <ContentWrapper title="Meu Painel">
      <div className={styles.container}>
        
        <div className={styles.headerSection}>
            <div className={styles.welcomeText}>
                <h2 className={styles.greeting}>Olá, {userName.split(' ')[0]}! 👋</h2>
                <p className={styles.subtitle}>Veja aqui o quanto as suas ações foram revertidas em Selos Cidadania.</p>
            </div>
        </div>

        <div className={styles.topCardsGrid}>
          {/* Card: Saldo */}
          <div className={styles.balanceCard}>
            <div className={styles.cardIconBox}>⭐</div>
            <div className={styles.balanceInfo}>
                <span className={styles.cardLabel}>Saldo Disponível</span>
                <h3 className={styles.balanceValue}>{dashboardData.seal_balance} <span className={styles.sealText}>Selos</span></h3>
            </div>
            <button className={styles.walletBtn} onClick={() => onNavigate('my_balance')}>
              Ver Carteira ➔
            </button>
          </div>
          
          {/* Card: Nova Ação */}
          <div className={styles.actionCard}>
             <div className={styles.actionCardContent}>
                 <div className={styles.cardIconBoxAction}>📸</div>
                 <div>
                    <h3 className={styles.actionTitle}>Nova Prova Social</h3>
                    <p className={styles.actionDesc}>Realizou uma atividade? Envie o comprovativo para ganhar selos.</p>
                 </div>
             </div>
            <button className={styles.sendProofBtn} onClick={() => onNavigate('send_social_proof')}>
              + Enviar Comprovativo
            </button>
          </div>
        </div>

        {/* NOVA SEÇÃO: CONTATO DA OSC */}
        {ongInfo && (ongInfo.whatsapp || ongInfo.instagram || ongInfo.facebook || ongInfo.website) && (
          <div className={styles.contactSection}>
            <div className={styles.contactHeader}>
              <h3>Fale com a sua OSC ({ongInfo.name})</h3>
              <p>Precisa de ajuda? Entre em contacto pelos canais oficiais abaixo:</p>
            </div>
            
            <div className={styles.contactButtonsGrid}>
              {ongInfo.whatsapp && (
                <a href={getWhatsAppLink(ongInfo.whatsapp)} target="_blank" rel="noreferrer" className={`${styles.contactBtn} ${styles.btnWhatsapp}`}>
                  <span className={styles.btnIcon}>💬</span> WhatsApp
                </a>
              )}
              {ongInfo.instagram && (
                <a href={ongInfo.instagram} target="_blank" rel="noreferrer" className={`${styles.contactBtn} ${styles.btnInstagram}`}>
                  <span className={styles.btnIcon}>📸</span> Instagram
                </a>
              )}
              {ongInfo.facebook && (
                <a href={ongInfo.facebook} target="_blank" rel="noreferrer" className={`${styles.contactBtn} ${styles.btnFacebook}`}>
                  <span className={styles.btnIcon}>📘</span> Facebook
                </a>
              )}
              {ongInfo.website && (
                <a href={ongInfo.website} target="_blank" rel="noreferrer" className={`${styles.contactBtn} ${styles.btnWebsite}`}>
                  <span className={styles.btnIcon}>🌐</span> Website
                </a>
              )}
            </div>
          </div>
        )}

        <div className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Últimos Envios</h3>
            <button className={styles.viewAllBtn} onClick={() => onNavigate('my_social_proofs')}>
              Ver histórico completo
            </button>
          </div>

          <div className={styles.historyContent}>
            {dashboardData.recent_proofs.length > 0 ? (
                <div className={styles.proofsList}>
                {dashboardData.recent_proofs.map(proof => {
                    const status = getStatusDisplay(proof.status);
                    return (
                    <div key={proof.id} className={styles.proofListItem}>
                        <div className={styles.proofMainInfo}>
                            <h4 className={styles.proofTitle}>{proof.title}</h4>
                            <span className={styles.proofDate}>
                                Enviado a: {new Date(proof.created_at).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <div className={`${styles.statusBadge} ${status.cls}`}>
                            {status.icon} {status.label}
                        </div>
                    </div>
                    );
                })}
                </div>
            ) : (
                <div className={styles.emptyHistory}>
                    <div className={styles.emptyIcon}>📂</div>
                    <h4>Ainda não enviou provas sociais</h4>
                    <p>Quando enviar as fotos das suas atividades, elas aparecerão aqui.</p>
                    <button className={styles.startBtn} onClick={() => onNavigate('send_social_proof')}>
                        Fazer o primeiro envio
                    </button>
                </div>
            )}
          </div>
        </div>
        
      </div>
    </ContentWrapper>
  );
};

export default UserDashboard;