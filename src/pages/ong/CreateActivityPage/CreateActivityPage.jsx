import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import InputField from '../../../components/ui/InputField/InputField';
import api from '../../../api/api';
import styles from './CreateActivityPage.module.css';

const CreateActivityPage = ({ user }) => {
  // Estado para cadastro de Atividade (Catálogo)
  const [activityData, setActivityData] = useState({ 
    description: '', 
    seal_value: '',
    validation_method: 'manual' // Fixo como manual
  });
  const [exampleImage, setExampleImage] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [msgActivity, setMsgActivity] = useState({ type: '', text: '' });

  // Estado para o Modal de Distribuição de Selos (Bônus)
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

    const formData = new FormData();
    formData.append('ong_id', ongId);
    formData.append('description', activityData.description);
    formData.append('seal_value', activityData.seal_value);
    formData.append('is_automatic', '0'); // Força a ser 0 (não automático)
    formData.append('validation_method', 'Validação por você (OSC)');
    
    if (exampleImage) {
      formData.append('example_image', exampleImage);
    }

    try {
      await api.post('/proofs/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsgActivity({ type: 'success', text: 'Atividade cadastrada com sucesso no catálogo!' });
      setActivityData({ description: '', seal_value: '', validation_method: 'manual' });
      setExampleImage(null);
      
      // Limpa o input de arquivo visualmente
      const fileInput = document.getElementById('example_image_input');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error(error);
      setMsgActivity({ type: 'error', text: 'Erro ao cadastrar atividade.' });
    } finally {
      setLoadingActivity(false);
    }
  };

  // --- LÓGICA DE DISTRIBUIÇÃO DE SELOS AVULSOS ---
  const openSendModal = async () => {
    setMsgSend({ type: '', text: '' });
    setSendData({ targetType: 'individual', userId: '', amount: '', reason: '' });
    setIsModalOpen(true);
    
    try {
      const response = await api.get(`/ongs/${ongId}/users`);
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
      
      setMsgSend({ type: 'success', text: 'Selos enviados com sucesso!' });
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    } catch (error) {
      setMsgSend({ type: 'error', text: error.response?.data?.error || 'Erro ao enviar selos.' });
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <ContentWrapper title="Catálogo de Atividades">
      <div className={styles.container}>
        
        {/* BLOCO 1: DISTRIBUIR SELOS (Ação Rápida) */}
        <div className={styles.headerActions}>
          <div className={styles.headerText}>
            <h3>Bonificação / Envio de Selos</h3>
            <p>Precisa enviar selos diretamente sem uma prova social? Envie para um beneficiário específico ou para todos da OSC.</p>
          </div>
          <Button onClick={openSendModal} style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff' }}>
            🎁 Enviar Selos Agora
          </Button>
        </div>

        {/* BLOCO 2: FORMULÁRIO DE NOVA ATIVIDADE */}
        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>Nova Atividade para o Catálogo</h3>
          
          {msgActivity.text && (
            <div className={msgActivity.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {msgActivity.text}
            </div>
          )}

          <form onSubmit={handleActivitySubmit}>
            <div className={styles.inputGroup}>
              <label>Nome da Atividade *</label>
              <input 
                type="text" 
                name="description" 
                required 
                value={activityData.description} 
                onChange={handleActivityChange} 
                placeholder="Ex: Participação na oficina de culinária" 
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Quantidade de Selos *</label>
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

            <div className={styles.inputGroup}>
              <label>Tipo de Validação</label>
              <select 
                name="validation_method" 
                value={activityData.validation_method} 
                onChange={handleActivityChange}
              >
                <option value="manual">Validada por você (OSC)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Imagem de Exemplo (Opcional)</label>
              <input 
                id="example_image_input"
                type="file" 
                accept="image/*"
                onChange={(e) => setExampleImage(e.target.files[0])}
                style={{ padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className={styles.formActions}>
              <Button type="submit" disabled={loadingActivity}>
                {loadingActivity ? 'A Cadastrar...' : 'Cadastrar Atividade'}
              </Button>
            </div>
          </form>
        </div>

        {/* MODAL PARA ENVIAR SELOS */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enviar Selos para Famílias">
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
                    Um beneficiário específico
                  </label>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="all" 
                      checked={sendData.targetType === 'all'} 
                      onChange={(e) => setSendData({...sendData, targetType: e.target.value})} 
                    />
                    Todos os beneficiários da OSC
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
                    <option value="">Selecione na lista...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (CPF: {u.cpf || 'S/N'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.inputGroup}>
                <label>Quantidade de Selos a enviar *</label>
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

              <div className={styles.formActions} style={{ marginTop: '20px', gap: '10px' }}>
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