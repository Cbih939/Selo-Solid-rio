import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './MyRedemptionsPage.module.css';
import api from '../../../api/api';

// A página agora recebe o 'user' logado como propriedade
const MyRedemptionsPage = ({ user }) => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garante que só faz o pedido se o utilizador estiver definido
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

  return (
    <ContentWrapper title="Meus Resgates">
      <ul className={styles.list}>
        {loading ? (
          <p>A carregar histórico...</p>
        ) : redemptions.length > 0 ? (
          redemptions.map((item, index) => (
            <li key={index} className={styles.listItem}>
              <span className={styles.prizeName}>{item.prize_name}</span>
              <span className={styles.date}>
                Resgatado em {new Date(item.redemption_date).toLocaleDateString('pt-BR')}
              </span>
            </li>
          ))
        ) : (
          <p>Você ainda não resgatou nenhum prémio.</p>
        )}
      </ul>
    </ContentWrapper>
  );
};

export default MyRedemptionsPage;