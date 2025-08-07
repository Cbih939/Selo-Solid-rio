import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './RedeemPrizesPage.module.css';

const RedeemPrizesPage = ({ user }) => {
  const [prizes, setPrizes] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        // Vai buscar a lista de prémios e o saldo do utilizador em paralelo
        const [prizesRes, balanceRes] = await Promise.all([
          api.get('/prizes'),
          api.get(`/users/${user.id}/balance`)
        ]);
        setPrizes(prizesRes.data);
        setUserBalance(balanceRes.data.seal_balance);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
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
    try {
      await api.post('/redemptions', {
        userId: user.id,
        prizeId: selectedPrize.id
      });
      alert("Prémio resgatado com sucesso!");
      setModalOpen(false);
      fetchData(); // Atualiza a lista de prémios e o saldo
    } catch (error) {
      alert(error.response?.data?.message || "Ocorreu um erro ao resgatar o prémio.");
    }
  };

  return (
    <ContentWrapper title="Resgatar Prêmios">
      <div className={styles.balanceInfo}>
        Seu Saldo: <strong>{userBalance} selos</strong>
      </div>
      <div className={styles.grid}>
        {prizes.map(prize => (
          <div key={prize.id} className={styles.prizeCard}>
            <h3 className={styles.prizeName}>{prize.name}</h3>
            <p className={styles.prizeCost}>{prize.cost} selos</p>
            <Button 
              onClick={() => handleRedeemClick(prize)}
              disabled={userBalance < prize.cost} // Desativa o botão se o saldo for insuficiente
            >
              Resgatar
            </Button>
          </div>
        ))}
      </div>

      {/* Modal de Confirmação */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Confirmar Resgate"
      >
        {selectedPrize && (
          <div>
            <p>Tem a certeza de que deseja resgatar o prémio <strong>"{selectedPrize.name}"</strong> por <strong>{selectedPrize.cost} selos</strong>?</p>
            <p>O seu novo saldo será de {userBalance - selectedPrize.cost} selos.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={confirmRedemption}>Confirmar</Button>
            </div>
          </div>
        )}
      </Modal>
    </ContentWrapper>
  );
};

export default RedeemPrizesPage;
