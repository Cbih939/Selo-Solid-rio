import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './RedeemPrizesPage.module.css';

const RedeemPrizesPage = ({ user }) => {
  const [prizes, setPrizes] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (user) {
      try {
        const [prizesRes, balanceRes] = await Promise.all([
          api.get('/prizes'),
          api.get(`/users/${user.id}/balance`) // Verifica se tem esta rota, caso contrário use /users/${user.id}
        ]);
        setPrizes(prizesRes.data);
        // Ajuste caso a sua API retorne o saldo diretamente no objeto do utilizador ou num campo específico
        setUserBalance(balanceRes.data.seal_balance || balanceRes.data.balance || 0);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeemClick = (prize) => {
    setSelectedPrize(prize);
    setModalOpen(true);
  };

  const confirmRedemption = async () => {
    setRedeeming(true);
    try {
      await api.post('/redemptions', {
        userId: user.id,
        prizeId: selectedPrize.id
      });
      alert(`🎉 Fantástico! Prémio "${selectedPrize.name}" resgatado com sucesso!`);
      setModalOpen(false);
      fetchData(); // Atualiza o saldo e a lista
    } catch (error) {
      alert(error.response?.data?.message || "Ocorreu um erro ao resgatar o prémio.");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <ContentWrapper title="Catálogo de Prémios">
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>A carregar a montra de prémios...</p>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Catálogo de Prémios">
      <div className={styles.container}>
        
        {/* CABEÇALHO DO SALDO */}
        <div className={styles.balanceBanner}>
          <div className={styles.balanceText}>
            <h2>Pronto para resgatar? 🎁</h2>
            <p>Escolha a sua recompensa. O seu saldo atual é de:</p>
          </div>
          <div className={styles.balanceDisplay}>
            <span className={styles.starIcon}>⭐</span>
            <strong className={styles.balanceAmount}>{userBalance}</strong>
            <span className={styles.balanceLabel}>Selos</span>
          </div>
        </div>

        {/* LISTA DE PRÉMIOS */}
        <div className={styles.grid}>
          {prizes.length > 0 ? (
            prizes.map(prize => {
              // CORREÇÃO: >= permite que o utilizador compre se tiver o valor exato
              const canAfford = userBalance >= prize.cost;

              return (
                <div key={prize.id} className={`${styles.prizeCard} ${!canAfford ? styles.disabledCard : ''}`}>
                  <div className={styles.prizeIconBox}>
                    <span className={styles.prizeEmoji}>🎁</span>
                  </div>
                  
                  <div className={styles.prizeDetails}>
                    <h3 className={styles.prizeName}>{prize.name}</h3>
                    <div className={styles.prizeCostTag}>
                      <span>Custo:</span>
                      <strong>{prize.cost} Selos</strong>
                    </div>
                  </div>

                  <button 
                    className={`${styles.redeemBtn} ${canAfford ? styles.btnActive : styles.btnDisabled}`}
                    onClick={() => handleRedeemClick(prize)}
                    disabled={!canAfford}
                  >
                    {canAfford ? 'Resgatar Prémio' : `Faltam ${prize.cost - userBalance} selos`}
                  </button>
                </div>
              );
            })
          ) : (
             <div className={styles.emptyState}>
               <p>Não há prémios disponíveis no catálogo neste momento.</p>
             </div>
          )}
        </div>

        {/* MODAL DE CONFIRMAÇÃO */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !redeeming && setModalOpen(false)} 
          title="Confirmar Resgate"
        >
          {selectedPrize && (
            <div className={styles.modalContent}>
              <div className={styles.modalIcon}>🛍️</div>
              <p className={styles.modalText}>
                Tem a certeza de que deseja resgatar o prémio <strong>"{selectedPrize.name}"</strong>?
              </p>
              
              <div className={styles.modalCalculation}>
                <div className={styles.calcRow}>
                  <span>Saldo Atual:</span>
                  <strong>{userBalance} selos</strong>
                </div>
                <div className={styles.calcRowMinus}>
                  <span>Custo do Prémio:</span>
                  <strong>- {selectedPrize.cost} selos</strong>
                </div>
                <div className={styles.calcRowResult}>
                  <span>Saldo Final:</span>
                  <strong>{userBalance - selectedPrize.cost} selos</strong>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => setModalOpen(false)}
                  disabled={redeeming}
                >
                  Cancelar
                </button>
                <button 
                  className={styles.confirmBtn} 
                  onClick={confirmRedemption}
                  disabled={redeeming}
                >
                  {redeeming ? 'A processar...' : 'Sim, Resgatar!'}
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </ContentWrapper>
  );
};

export default RedeemPrizesPage;