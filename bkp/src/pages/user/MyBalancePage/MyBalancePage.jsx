import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './MyBalancePage.module.css';
import api from '../../../api/api';

// A página agora recebe o 'user' logado como propriedade
const MyBalancePage = ({ user }) => {
  // O estado inicial agora é null para indicar que os dados ainda não foram carregados.
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garante que só faz o pedido se o utilizador estiver definido
    if (user && user.id) {
      const fetchBalance = async () => {
        setLoading(true);
        try {
          // Vai buscar o saldo mais recente à API
          const response = await api.get(`/users/${user.id}/balance`);
          setBalance(response.data.seal_balance);
        } catch (error) {
          console.error("Erro ao buscar saldo:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchBalance();
    }
  }, [user]); // O efeito é executado sempre que o utilizador mudar

  return (
    <ContentWrapper title="Meu Saldo">
      <div className={styles.balanceCard}>
        <p className={styles.label}>Você tem</p>
        <p className={styles.balance}>
          {/* Mostra '...' enquanto carrega, e o saldo depois */}
          {loading ? '...' : balance}
        </p>
        <p className={styles.label}>selos para resgatar!</p>
      </div>
    </ContentWrapper>
  );
};

export default MyBalancePage;