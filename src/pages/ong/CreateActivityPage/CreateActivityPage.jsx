// Arquivo: src/pages/ong/CreateActivityPage/CreateActivityPage.jsx

import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './CreateActivityPage.module.css';

const CreateActivityPage = ({ user }) => {
  const [activityData, setActivityData] = useState({ description: '', seal_value: '', validation_method: 'manual' });
  const [exampleImage, setExampleImage] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [msgActivity, setMsgActivity] = useState({ type: '', text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [sendData, setSendData] = useState({ targetType: 'individual', userId: '', amount: '', reason: '' });
  const [loadingSend, setLoadingSend] = useState(false);
  const [msgSend, setMsgSend] = useState({ type: '', text: '' });

  const ongId = user?.ong_id || user?.id;

  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivityData(prev => ({ ...prev, [name]: value }));
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoadingActivity(true);
    setMsgActivity({ type: '', text: '' });

    const formData = new FormData();
    if (ongId) formData.append('ong_id', ongId);
    formData.append('description', activityData.description);
    formData.append('seal_value', activityData.seal_value);
    formData.append('is_automatic', '0'); 
    formData.append('validation_method', 'Validação por você (OSC)');
    
    // Tentamos enviar com o nome 'image' que é o padrão da maioria dos backends
    if (exampleImage) {
        formData.append('image', exampleImage); 
    }

    try {
      await api.post('/proofs/activities', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsgActivity({ type: 'success', text: 'Atividade cadastrada com sucesso!' });
      setActivityData({ description: '', seal_value: '', validation_method: 'manual' });
      setExampleImage(null);
      const fileInput = document.getElementById('example_image_input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error(error);
      // Se o Multer continuar a reclamar do nome do campo de imagem, avisamos o utilizador
      if (error.response && error.response.status === 500) {
          setMsgActivity({ type: 'error', text: 'Erro no servidor. Tente cadastrar a atividade SEM a imagem de exemplo.' });
      } else {
          setMsgActivity({ type: 'error', text: 'Erro ao cadastrar atividade.' });
      }
    } finally {
      setLoadingActivity(false);
    }
  };

  const openSendModal = async () => {
    setMsgSend({ type: '', text: '' });
    setSendData({ targetType: 'individual', userId: '', amount: '', reason: '' });
    setIsModalOpen(true);
    setUsers([]);
    
    try {
      // Busca Global Segura
      const response = await api.get('/users');
      let allUsers = [];
      if (Array.isArray(response.data)) {
        allUsers = response.data;
      } else if (response.data && Array.isArray(response.data.users)) {
        allUsers = response.data.users;
      }

      const strOngId = String(ongId);
      const beneficiaries = allUsers.filter(u => {
        const isUserRole = String(u.role_id) === '4' || u.role === 'user';
        const isMyOng = !ongId || String(u.ong_id) === strOngId;
        return isUserRole && isMyOng;
      });

      setUsers(beneficiaries.sort((a, b) => a.name.localeCompare(b.name)));
      if (beneficiaries.length === 0) setMsgSend({ type: 'error', text: 'Nenhuma família encontrada.' });

    } catch (error) {
      console.error("ERRO AO BUSCAR FAMÍLIAS:", error);
      alert(`Erro ao carregar utilizadores. O Backend devolveu: ${error.message}`);
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
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error) {
      setMsgSend({ type: 'error', text: error.response?.data?.error || 'Erro ao enviar selos.' });
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <ContentWrapper title="Catálogo de Atividades">
      <div className={styles.container}>
        
        <div className={styles.headerActions}>
          <div className={styles.headerText}>
            <h3>Bonificação / Envio de Selos</h3>
            <p>Precisa enviar selos diretamente sem uma prova social? Envie para um beneficiário ou para todos.</p>
          </div>
          <Button onClick={openSendModal} style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff' }}>
            🎁 Enviar Selos Agora
          </Button>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>Nova Atividade para o Catálogo</h3>
          
          {msgActivity.text && (
            <div className={msgActivity.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {msgActivity.text}
            </div>
          )}

          <form onSubmit={handleActivitySubmit}>
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome da Atividade *</label>
                <input type="text" name="description" required value={activityData.description} onChange={handleActivityChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Quantidade de Selos *</label>
                <input type="number" name="seal_value" min="1" required value={activityData.seal_value} onChange={handleActivityChange} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Tipo de Validação</label>
              <select name="validation_method" value={activityData.validation_method} onChange={handleActivityChange}>
                <option value="manual">Validada por você (OSC)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Imagem de Exemplo (Opcional)</label>
              <input id="example_image_input" type="file" accept="image/*" onChange={(e) => setExampleImage(e.target.files[0])} style={{ padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
            </div>

            <div className={styles.formActions}>
              <Button type="submit" disabled={loadingActivity}>
                {loadingActivity ? 'A Cadastrar...' : 'Cadastrar Atividade'}
              </Button>
            </div>
          </form>
        </div>

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
                    <input type="radio" name="targetType" value="individual" checked={sendData.targetType === 'individual'} onChange={(e) => setSendData({...sendData, targetType: e.target.value})} />
                    Um beneficiário específico
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="targetType" value="all" checked={sendData.targetType === 'all'} onChange={(e) => setSendData({...sendData, targetType: e.target.value})} />
                    Todos os beneficiários
                  </label>
                </div>
              </div>

              {sendData.targetType === 'individual' && (
                <div className={styles.inputGroup}>
                  <label>Selecione o Beneficiário *</label>
                  <select required value={sendData.userId} onChange={(e) => setSendData({...sendData, userId: e.target.value})}>
                    <option value="">Selecione na lista...</option>
                    {users.length === 0 && <option value="" disabled>Lista Vazia / A carregar...</option>}
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (CPF: {u.cpf || 'S/N'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.inputGroup}>
                <label>Quantidade de Selos a enviar *</label>
                <input type="number" min="1" required value={sendData.amount} onChange={(e) => setSendData({...sendData, amount: e.target.value})} />
              </div>

              <div className={styles.inputGroup}>
                <label>Motivo / Observação (Opcional)</label>
                <input type="text" value={sendData.reason} onChange={(e) => setSendData({...sendData, reason: e.target.value})} placeholder="Ex: Bônus extra" />
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