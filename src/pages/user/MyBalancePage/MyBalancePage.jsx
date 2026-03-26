import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './MyBalancePage.module.css';
import api from '../../../api/api';

const MyBalancePage = () => { 
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/users/me/balance`); 
        setBalance(response.data.seal_balance);
      } catch (error) {
        console.error("Erro ao buscar saldo:", error);
        setBalance('N/A'); 
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []); 

  if (loading) {
    return (
      <ContentWrapper title="Minha Carteira">
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>A carregar a sua carteira digital...</p>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Minha Carteira">
      <div className={styles.container}>
        
        {/* Cartão Principal de Saldo (Estilo Premium) */}
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <span className={styles.walletTitle}>Saldo Disponível</span>
            <div className={styles.walletIconBox}>
                <span className={styles.walletIcon}>💳</span>
            </div>
          </div>
          
          <div className={styles.walletBody}>
            <h1 className={styles.balanceAmount}>
                {balance !== 'N/A' ? balance : <span className={styles.errorText}>Erro</span>}
            </h1>
            <span className={styles.balanceLabel}>Selos Cidadania</span>
          </div>

          <div className={styles.walletFooter}>
            <div className={styles.chip}>Membro Ativo</div>
            <p>Acumule selos e troque por recompensas incríveis!</p>
          </div>
        </div>

        {/* Secção de Dicas / Engajamento */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoIconBox}>📸</div>
            <div className={styles.infoText}>
                <h3>Como ganhar mais?</h3>
                <p>Vá até à aba <strong>"Enviar Prova Social"</strong> escolha a ação que realizou, indique os beneficiários que participaram da atividade e anexe uma imagem ou documento comprovativo para encher a sua carteira.
</p>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIconBox}>🎁</div>
            <div className={styles.infoText}>
                <h3>O que fazer com os selos?</h3>
                <p>Os seus selos têm valor real! Eles podem ser trocados no <strong>Shoping Cidadania</strong>. Verifique o calendário nas redes sociais da sua instituição.</p>
            </div>
          </div>
        </div>

      </div>
    </ContentWrapper>
  );
};

export default MyBalancePage;