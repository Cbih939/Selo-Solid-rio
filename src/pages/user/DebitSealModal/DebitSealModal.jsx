// DebitSealModal.jsx

import React, { useState } from 'react';
import api from '../api/api';
import InputField from './ui/InputField/InputField';
import Button from './ui/Button/Button';

const DebitSealModal = ({ user, onClose, onDebitSuccess }) => {
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ID do prêmio "Débito Manual" que criamos no banco de dados
  const DEBIT_PRIZE_ID = 1; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }
    if (amount > user.seal_balance) {
      setError('O usuário não tem selos suficientes.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/users/${user.id}/debit-seals`, {
        amount: parseInt(amount, 10),
        prizeId: DEBIT_PRIZE_ID,
      });
      
      // Sucesso!
      onDebitSuccess(response.data.newBalance); // Atualiza o saldo na tela anterior
      onClose(); // Fecha o modal

    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro ao debitar os selos.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Debitar Selos de {user.name}</h4>
      <p>Saldo atual: {user.seal_balance} selos</p>
      
      <InputField
        label="Quantidade a Debitar"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="1"
        max={user.seal_balance}
        required
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Processando...' : 'Confirmar Débito'}
        </Button>
      </div>
    </form>
  );
};

export default DebitSealModal;
