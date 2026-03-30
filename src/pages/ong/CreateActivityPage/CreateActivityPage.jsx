// Arquivo: src/pages/ong/CreateActivityPage/CreateActivityPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './CreateActivityPage.module.css';

const CreateActivityPage = ({ user }) => {
  // Estado para cadastro de Atividade (Prova Social)
  const [activityData, setActivityData] = useState({ description: '', seal_value: '' });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [msgActivity, setMsgActivity] = useState({ type: '', text: '' });

  // Estado para o Modal de Distribuição de Selos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [sendData, setSendData] = useState({ targetType: 'individual', userId: '', amount: '', reason: '' });
  const [loadingSend, setLoadingSend] = useState(false);
  const [msgSend, setMsgSend] = useState({ type: '', text: '' });

  const ongId = user?.ong_id || user?.id;

  // --- LÓGICA DE CRIAR ATIVIDADE (CATÁLOGO) ---
  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivityData(prev => ({ ...prev, [name]: value }));
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoadingActivity(true);
    setMsgActivity({ type: '', text: '' });

    try {
      await api.post('/proofs/activities', {
        ong_id: ongId,
        description: activityData.description,
        seal_value: parseInt(activityData.seal_value, 10)
      });
      setMsgActivity({ type: 'success', text: 'Atividade cadastrada com sucesso no catálogo!' });
      setActivityData({ description: '', seal_value: '' });
    } catch (error) {
      setMsgActivity({ type: 'error', text: 'Erro ao cadastrar atividade.' });
    } finally {
      setLoadingActivity(false);
    }
  };

  // --- LÓGICA DE DISTRIBUIÇÃO DE SELOS ---
  const openSendModal = async () => {
    setMsgSend({ type: '', text: '' });
    setSendData({ targetType: 'individual', userId: '', amount: '', reason: '' });
    setIsModalOpen(true);
    
    // Busca a lista de usuários da OSC para preencher o dropdown
    try {
      const response = await api.get(`/ongs/${ongId}/users`);
      // Ordenar por nome para facilitar a busca
      const sortedUsers = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    setLoadingSend(true);
    setMsgSend({ type: '', text: '' });

    try {
      await api.post('/users/send-seals', {
        ong_id: ongId,
        targetType: sendData.targetType,
        userId: sendData.userId,
        amount: parseInt(sendData.amount, 10),
        reason: sendData.reason
      });
      
      setMsgSend({ type: 'success', text: 'Selos creditados com sucesso!' });
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2500);
    } catch (error) {
      setMsgSend({ type: 'error', text: error.response?.data?.error || 'Erro ao enviar selos.' });
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <ContentWrapper title="Gerenciar Provas e Selos">
      <div className={styles.container}>
        
        {/* BLOCO SUPERIOR: DISTRIBUIR SELOS */}
        <div className={styles.headerActions}>
          <div className={styles.headerText}>
            <h3>Bonificação Rápida</h3>
            <p>Deseja enviar selos diretamente para um beneficiário ou para todas as famílias da OSC de uma só vez?</p>
          </div>
          <Button onClick={openSendModal} style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}>
            🎁 Distribuir Selos
          </Button>
        </div>

        {/* BLOCO INFERIOR: CADASTRAR ATIVIDADE */}
        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>Cadastrar Novo Tipo de Prova no Catálogo</h3>
          
          {msgActivity.text && (
            <div className={msgActivity.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {msgActivity.text}
            </div>
          )}

          <form onSubmit={handleActivitySubmit}>
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Descrição da Atividade / Prova *</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  value={activityData.description} 
                  onChange={handleActivityChange} 
                  placeholder="Ex: Participação na reunião de pais" 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Valor em Selos *</label>
                <input 
                  type="number" 
                  name="seal_value" 
                  min="1" 
                  required 
                  value={activityData.seal_value} 
                  onChange={handleActivityChange} 
                  placeholder="Ex: 50" 
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" disabled={loadingActivity}>
                {loadingActivity ? 'A Cadastrar...' : 'Adicionar ao Catálogo'}
              </Button>
            </div>
          </form>
        </div>

        {/* MODAL DE DISTRIBUIÇÃO DE SELOS */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Distribuir Selos">
          <div className={styles.modalContent}>
            
            {msgSend.text && (
              <div className={msgSend.type === 'success' ? styles.successMessage : styles.errorMessage}>
                {msgSend.text}
              </div>
            )}

            <form onSubmit={handleSendSubmit}>
              <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                <label>Para quem deseja enviar?</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="individual" 
                      checked={sendData.targetType === 'individual'} 
                      onChange={(e) => setSendData({...sendData, targetType: e.target.value})} 
                    />
                    Beneficiário Único
                  </label>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="all" 
                      checked={sendData.targetType === 'all'} 
                      onChange={(e) => setSendData({...sendData, targetType: e.target.value})} 
                    />
                    Todos da Instituição
                  </label>
                </div>
              </div>

              {sendData.targetType === 'individual' && (
                <div className={styles.inputGroup}>
                  <label>Selecione o Beneficiário *</label>
                  <select 
                    required 
                    value={sendData.userId} 
                    onChange={(e) => setSendData({...sendData, userId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (CPF: {u.cpf || 'S/N'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.inputGroup}>
                <label>Quantidade de Selos *</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={sendData.amount} 
                  onChange={(e) => setSendData({...sendData, amount: e.target.value})} 
                  placeholder="Ex: 100" 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Motivo / Observação (Opcional)</label>
                <input 
                  type="text" 
                  value={sendData.reason} 
                  onChange={(e) => setSendData({...sendData, reason: e.target.value})} 
                  placeholder="Ex: Bônus de fim de ano" 
                />
              </div>

              <div className={styles.formActions} style={{ marginTop: '30px' }}>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loadingSend}>
                  {loadingSend ? 'A Enviar...' : 'Confirmar Envio'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

      </div>
    </ContentWrapper>
  );
};

export default CreateActivityPage;