import React, { useState } from 'react';
import api from '../../../api/api';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import styles from './DebitSealModal.module.css';

const DebitSealModal = ({ user, onClose, onDebitSuccess }) => {
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ID do prémio "Débito Manual" criado na base de dados
  const DEBIT_PRIZE_ID = 1; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    const debitValue = parseInt(amount, 10);

    if (isNaN(debitValue) || debitValue <= 0) {
      setError('A quantidade deve ser um número maior que zero.');
      return;
    }
    if (debitValue > user.seal_balance) {
      setError(`Saldo insuficiente. O utilizador só tem ${user.seal_balance} selos.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/users/${user.id}/debit-seals`, {
        amount: debitValue,
        prizeId: DEBIT_PRIZE_ID,
      });
      
      // Sucesso! Atualiza a tela anterior e fecha
      onDebitSuccess(response.data.newBalance); 
      onClose(); 

    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro ao debitar os selos.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerInfo}>
        <div className={styles.avatarBox}>
          <span className={styles.avatarIcon}>👤</span>
        </div>
        <div className={styles.userInfo}>
          <h4 className={styles.userName}>{user.name}</h4>
          <span className={styles.userCpf}>CPF: {user.cpf || 'Não informado'}</span>
        </div>
      </div>

      <div className={styles.balanceHighlight}>
        <span className={styles.balanceLabel}>Saldo Atual Disponível</span>
        <div className={styles.balanceDisplay}>
          <strong className={styles.balanceValue}>{user.seal_balance}</strong>
          <span className={styles.balanceUnit}>selos</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.inputSection}>
          <InputField
            label="Quantidade a Debitar"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={user.seal_balance}
            required
          />
          <small className={styles.helperText}>
            Indique o número exato de selos que deseja remover da conta.
          </small>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading || user.seal_balance <= 0}>
            {loading ? 'A Processar...' : 'Confirmar Débito'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DebitSealModal;