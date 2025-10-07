// Arquivo: pages/user/MyBalancePage/MyBalancePage.jsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './MyBalancePage.module.css';
import api from '../../../api/api';

const MyBalancePage = () => { // Removida a propriedade 'user', pois não é mais necessária
 const [balance, setBalance] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchBalance = async () => {
   setLoading(true);
   try {
        // === INÍCIO DA CORREÇÃO ===
        // O URL foi alterado para o endpoint correto do backend, que não precisa do ID do usuário.
    const response = await api.get(`/users/me/balance`); 
        // === FIM DA CORREÇÃO ===
    setBalance(response.data.seal_balance);
   } catch (error) {
    console.error("Erro ao buscar saldo:", error);
        setBalance('N/A'); // Define um valor de erro caso a API falhe
   } finally {
    setLoading(false);
   }
  };
  fetchBalance();
 }, []); // O array de dependências está vazio para executar apenas uma vez, quando o componente monta.

 return (
  <ContentWrapper title="Meu Saldo">
   <div className={styles.balanceCard}>
    <p className={styles.label}>Você tem</p>
    <h1 className={styles.balance}>
     {loading ? '...' : balance}
    </h1>
    <p className={styles.label}>selos para resgatar!</p>
   </div>
  </ContentWrapper>
 );
};

export default MyBalancePage;