// Arquivo: src/pages/ong/CreateActivityPage/CreateActivityPage.jsx

import React, { useState, useMemo } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './CreateActivityPage.module.css';

const CreateActivityPage = ({ user }) => {
  // --- Estados da Atividade ---
  const [activityData, setActivityData] = useState({ description: '', seal_value: '', validation_method: '' });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [msgActivity, setMsgActivity] = useState({ type: '', text: '' });

  // --- Estados do Modal de Transação (Envio / Débito) ---
  const [modalType, setModalType] = useState(null); // 'send' ou 'debit'
  const [users, setUsers] = useState([]);
  
  // Estados para o campo de pesquisa e seleção
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [transactionData, setTransactionData] = useState({ targetType: 'individual', amount: '', reason: '' });
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [msgTransaction, setMsgTransaction] = useState({ type: '', text: '' });

  const ongId = user?.ong_id || user?.id;

  // ==========================================
  // LÓGICA DO CATÁLOGO DE ATIVIDADES
  // ==========================================
  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivityData(prev => ({ ...prev, [name]: value }));
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoadingActivity(true);
    setMsgActivity({ type: '', text: '' });

    try {
      // Como removemos a imagem, podemos enviar um JSON limpo
      const payload = {
        ong_id: ongId,
        description: activityData.description,
        seal_value: activityData.seal_value,
        is_automatic: 0,
        validation_method: activityData.validation_method || 'Validação manual (Padrão)'
      };

      await api.post('/proofs/activities', payload);
      
      setMsgActivity({ type: 'success', text: 'Atividade cadastrada com sucesso!' });
      setActivityData({ description: '', seal_value: '', validation_method: '' });
    } catch (error) {
      console.error(error);
      setMsgActivity({ type: 'error', text: 'Erro ao cadastrar atividade.' });
    } finally {
      setLoadingActivity(false);
    }
  };

  // ==========================================
  // LÓGICA DE ENVIO E DÉBITO DE SELOS
  // ==========================================
  const openTransactionModal = async (type) => {
    setModalType(type);
    setMsgTransaction({ type: '', text: '' });
    setTransactionData({ targetType: 'individual', amount: '', reason: '' });
    setUserSearchTerm('');
    setSelectedUser(null);
    setUsers([]);
    
    try {
      // Busca Global de utilizadores
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

      setUsers(beneficiaries);
      if (beneficiaries.length === 0) setMsgTransaction({ type: 'error', text: 'Nenhuma família encontrada.' });

    } catch (error) {
      console.error("ERRO AO BUSCAR FAMÍLIAS:", error);
      alert(`Erro ao carregar utilizadores. O Backend devolveu: ${error.message}`);
    }
  };

  // Filtra os utilizadores com base na pesquisa (Nome, CPF ou ID)
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return [];
    const term = userSearchTerm.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.cpf && u.cpf.toLowerCase().includes(term)) ||
      (u.id && u.id.toString() === term)
    ).slice(0, 10); // Limita a 10 resultados para não poluir o ecrã
  }, [users, userSearchTerm]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (transactionData.targetType === 'individual' && !selectedUser) {
      setMsgTransaction({ type: 'error', text: 'Por favor, pesquise e selecione um beneficiário.' });
      return;
    }

    setLoadingTransaction(true);
    setMsgTransaction({ type: '', text: '' });

    try {
      if (modalType === 'send') {
        // Enviar Selos
        await api.post('/users/send-seals', {
          ong_id: ongId,
          targetType: transactionData.targetType,
          userId: selectedUser?.id,
          amount: parseInt(transactionData.amount, 10),
          reason: transactionData.reason
        });
        setMsgTransaction({ type: 'success', text: 'Selos enviados com sucesso!' });
      } else {
        // Debitar Selos
        await api.post(`/users/${selectedUser.id}/debit-seals`, {
          amount: parseInt(transactionData.amount, 10),
          reason: transactionData.reason
        });
        setMsgTransaction({ type: 'success', text: 'Débito realizado com sucesso!' });
      }

      setTimeout(() => setModalType(null), 2000);
    } catch (error) {
      setMsgTransaction({ type: 'error', text: error.response?.data?.error || 'Erro ao processar transação.' });
    } finally {
      setLoadingTransaction(false);
    }
  };

  return (
    <ContentWrapper title="Catálogo de Atividades">
      <div className={styles.container}>
        
        {/* --- CABEÇALHO: AÇÕES DE ENVIO E DÉBITO --- */}
        <div className={styles.headerActions}>
          <div className={styles.headerText}>
            <h3>Gestão Manual de Selos</h3>
            <p>Faça envios extras ou debite selos dos beneficiários diretamente por aqui.</p>
          </div>
          <div className={styles.actionButtonsRow}>
            <Button onClick={() => openTransactionModal('send')} style={{ backgroundColor: '#f97316', borderColor: '#f97316', color: '#fff' }}>
              🎁 Enviar Selos Extra
            </Button>
            <Button onClick={() => openTransactionModal('debit')} style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}>
              💰 Debitar Selos
            </Button>
          </div>
        </div>

        {/* --- FORMULÁRIO: NOVA ATIVIDADE --- */}
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
                <input type="text" name="description" required value={activityData.description} onChange={handleActivityChange} placeholder="Ex: Capacitação inicial presencial..." />
              </div>
              <div className={styles.inputGroup}>
                <label>Quantidade de Selos *</label>
                <input type="number" name="seal_value" min="1" required value={activityData.seal_value} onChange={handleActivityChange} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Forma de Validação (Opcional)</label>
              <input 
                type="text" 
                name="validation_method" 
                value={activityData.validation_method} 
                onChange={handleActivityChange} 
                placeholder="Ex: Assinatura na lista de presença" 
              />
              <small style={{ color: '#64748b', marginTop: '4px' }}>Descreva brevemente como a OSC irá comprovar que a família realizou a atividade.</small>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" disabled={loadingActivity} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                {loadingActivity ? 'A Cadastrar...' : 'Cadastrar Atividade'}
              </Button>
            </div>
          </form>
        </div>

        {/* --- MODAL UNIFICADO (ENVIO OU DÉBITO) --- */}
        <Modal 
          isOpen={modalType !== null} 
          onClose={() => setModalType(null)} 
          title={modalType === 'send' ? "Enviar Selos para Famílias" : "Debitar Selos de Beneficiário"}
        >
          <div className={styles.modalContent}>
            
            {msgTransaction.text && (
              <div className={msgTransaction.type === 'success' ? styles.successMessage : styles.errorMessage}>
                {msgTransaction.text}
              </div>
            )}

            <form onSubmit={handleTransactionSubmit}>
              
              {/* Opção Todos/Individual - Apenas para Envio */}
              {modalType === 'send' && (
                <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                  <label>Para quem deseja enviar?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="targetType" value="individual" checked={transactionData.targetType === 'individual'} onChange={(e) => { setTransactionData({...transactionData, targetType: e.target.value}); setSelectedUser(null); }} />
                      Um beneficiário específico
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="targetType" value="all" checked={transactionData.targetType === 'all'} onChange={(e) => { setTransactionData({...transactionData, targetType: e.target.value}); setSelectedUser(null); }} />
                      Todos os beneficiários
                    </label>
                  </div>
                </div>
              )}

              {/* Bloco de Pesquisa de Beneficiário */}
              {transactionData.targetType === 'individual' && (
                <div className={styles.inputGroup}>
                  <label>Selecione o Beneficiário *</label>
                  
                  {selectedUser ? (
                    <div className={styles.selectedBadge}>
                      <div>
                        <strong>{selectedUser.name}</strong> <br/>
                        <small>CPF: {selectedUser.cpf || 'S/N'} | ID: {selectedUser.id}</small>
                      </div>
                      <button type="button" className={styles.clearBtn} onClick={() => setSelectedUser(null)}>Trocar</button>
                    </div>
                  ) : (
                    <div className={styles.autocompleteWrapper}>
                      <input 
                        type="text" 
                        placeholder="Pesquise por Nome, CPF ou ID..." 
                        value={userSearchTerm} 
                        onChange={(e) => setUserSearchTerm(e.target.value)} 
                        autoComplete="off"
                      />
                      {userSearchTerm && filteredUsers.length > 0 && (
                        <ul className={styles.autocompleteList}>
                          {filteredUsers.map(u => (
                            <li key={u.id} className={styles.autocompleteItem} onClick={() => { setSelectedUser(u); setUserSearchTerm(''); }}>
                              <strong>{u.name}</strong> <br/>
                              <small>CPF: {u.cpf || 'S/N'} | ID: {u.id}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                      {userSearchTerm && filteredUsers.length === 0 && (
                        <div className={styles.autocompleteEmpty}>Nenhum beneficiário encontrado.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.inputGroup}>
                <label>Quantidade de Selos *</label>
                <input type="number" min="1" required value={transactionData.amount} onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})} />
              </div>

              <div className={styles.inputGroup}>
                <label>Motivo / Observação (Opcional)</label>
                <input type="text" value={transactionData.reason} onChange={(e) => setTransactionData({...transactionData, reason: e.target.value})} placeholder={modalType === 'send' ? "Ex: Bônus extra" : "Ex: Resgate de cesta básica"} />
              </div>

              <div className={styles.formActions} style={{ marginTop: '20px', gap: '10px' }}>
                <Button type="button" variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
                <Button type="submit" disabled={loadingTransaction} style={{ backgroundColor: modalType === 'send' ? '#ea580c' : '#dc2626', borderColor: modalType === 'send' ? '#ea580c' : '#dc2626' }}>
                  {loadingTransaction ? 'A Processar...' : (modalType === 'send' ? 'Confirmar Envio' : 'Confirmar Débito')}
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