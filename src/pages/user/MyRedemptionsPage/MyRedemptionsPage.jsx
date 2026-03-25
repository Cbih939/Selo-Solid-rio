import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './MyRedemptionsPage.module.css';
import api from '../../../api/api';

const MyRedemptionsPage = ({ user }) => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      const fetchRedemptions = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/redemptions/${user.id}`);
          setRedemptions(response.data);
        } catch (error) {
          console.error("Erro ao buscar resgates:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchRedemptions();
    }
  }, [user]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <ContentWrapper title="Histórico de Resgates">
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>A carregar os seus prémios...</p>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Histórico de Resgates">
      <div className={styles.container}>
        
        <div className={styles.headerSection}>
            <p className={styles.introText}>
                Acompanhe aqui todas as recompensas incríveis que já conquistou com os seus selos!
            </p>
        </div>

        {redemptions.length > 0 ? (
          <div className={styles.listContainer}>
            {redemptions.map((item, index) => (
              <div key={item.id || index} className={styles.redemptionCard}>
                
                <div className={styles.cardLeft}>
                    <div className={styles.iconBox}>
                        <span className={styles.giftIcon}>🛍️</span>
                    </div>
                    <div className={styles.prizeInfo}>
                        <h4 className={styles.prizeName}>{item.prize_name}</h4>
                        <span className={styles.date}>
                            Resgatado em {formatDateTime(item.redemption_date)}
                        </span>
                    </div>
                </div>

                <div className={styles.cardRight}>
                    <div className={styles.costBadge}>
                        <span className={styles.minusSign}>-</span>
                        <strong>{item.seals_redeemed || item.cost || '?'}</strong> 
                        <span className={styles.sealLabel}>Selos</span>
                    </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎁</div>
            <h3>Ainda não fez nenhum resgate</h3>
            <p>Continue a enviar as suas provas sociais para acumular selos e trocar por prémios fantásticos!</p>
          </div>
        )}

      </div>
    </ContentWrapper>
  );
};

export default MyRedemptionsPage;