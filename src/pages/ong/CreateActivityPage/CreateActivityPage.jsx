// Arquivo: src/pages/ong/CreateActivityPage/CreateActivityPage.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './CreateActivityPage.module.css';

const CreateActivityPage = ({ user }) => {
  const ongId = user?.ong_id || user?.id;

  // --- Estados da Atividade (Criação) ---
  const [activityData, setActivityData] = useState({ description: '', seal_value: '', validation_method: '' });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [msgActivity, setMsgActivity] = useState({ type: '', text: '' });

  // --- Estados da Lista de Atividades e Edição ---
  const [activities, setActivities] = useState([]);
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [msgEdit, setMsgEdit] = useState({ type: '', text: '' });
  const [loadingEdit, setLoadingEdit] = useState(false);

  // --- Estados do Modal de Transação (Envio / Débito) ---
  const [modalType, setModalType] = useState(null); // 'send' ou 'debit'
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [transactionData, setTransactionData] = useState({ targetType: 'individual', amount: '', reason: '' });
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [msgTransaction, setMsgTransaction] = useState({ type: '', text: '' });

  // ==========================================
  // BUSCAR ATIVIDADES E PROVAS PENDENTES
  // ==========================================
  const fetchActivitiesData = useCallback(async () => {
    setLoadingList(true);
    try {
      // Tenta buscar as atividades da ONG (com fallback para variações comuns de rotas)
      let actRes;
      try {
        actRes = await api.get(`/ongs/${ongId}/activities`);
      } catch (e) {
        actRes = await api.get(`/proofs/activities/ong/${ongId}`);
      }
      setActivities(actRes.data || []);

      // Busca as provas pendentes para verificar se a atividade pode ser editada
      const pendingRes = await api.get(`/proofs/pending/${ongId}`);
      setPendingProofs(pendingRes.data || []);

    } catch (error) {
      console.error("Erro ao carregar lista de atividades:", error);
    } finally {
      setLoadingList(false);
    }
  }, [ongId]);

  useEffect(() => {
    if (ongId) {
      fetchActivitiesData();
    }
  }, [fetchActivitiesData, ongId]);

  // ==========================================
  // LÓGICA DO CATÁLOGO DE ATIVIDADES (CRIAR)
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
      fetchActivitiesData(); // Atualiza a lista
    } catch (error) {
      console.error(error);
      setMsgActivity({ type: 'error', text: 'Erro ao cadastrar atividade.' });
    } finally {
      setLoadingActivity(false);
    }
  };

  // ==========================================
  // LÓGICA DE EDIÇÃO E EXCLUSÃO DE ATIVIDADES
  // ==========================================
  const openEditModal = (act) => {
    setMsgEdit({ type: '', text: '' });
    setActivityToEdit({ ...act });
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setActivityToEdit(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoadingEdit(true);
    setMsgEdit({ type: '', text: '' });

    try {
      const payload = {
        ong_id: ongId,
        description: activityToEdit.description,
        seal_value: activityToEdit.seal_value,
        is_automatic: 0,
        validation_method: activityToEdit.validation_method
      };

      await api.put(`/proofs/activities/${activityToEdit.id}`, payload);
      setMsgEdit({ type: 'success', text: 'Atividade atualizada com sucesso!' });
      fetchActivitiesData();
      setTimeout(() => setEditModalOpen(false), 2000);
    } catch (error) {
      setMsgEdit({ type: 'error', text: 'Erro ao atualizar a atividade.' });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta atividade do catálogo?')) {
      try {
        await api.delete(`/proofs/activities/${id}`);
        fetchActivitiesData();
        alert('Atividade excluída com sucesso.');
      } catch (error) {
        alert(error.response?.data?.error || 'Erro ao excluir atividade.');
      }
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
      const response = await api.get(`/ongs/${ongId}/users`);
      const beneficiaries = Array.isArray(response.data) ? response.data : [];
      setUsers(beneficiaries.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      
      if (beneficiaries.length === 0) {
        setMsgTransaction({ type: 'error', text: 'Nenhuma família cadastrada na sua OSC encontrada.' });
      }
    } catch (error) {
      alert(`Erro ao carregar utilizadores. O Backend devolveu: ${error.message}`);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return [];
    const term = userSearchTerm.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.cpf && u.cpf.toLowerCase().includes(term)) ||
      (u.id && u.id.toString() === term)
    ).slice(0, 10);
  }, [users, userSearchTerm]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (transactionData.targetType === 'individual' && !selectedUser) {
      setMsgTransaction({ type: 'error', text: 'Por favor, pesquise e selecione um beneficiário.' });
      return;
    }
    setLoadingTransaction(true);
    setMsgTransaction({ type: '', text: '' });

    try {
      if (modalType === 'send') {
        await api.post('/users/send-seals', {
          ong_id: ongId,
          targetType: transactionData.targetType,
          userId: selectedUser?.id,
          amount: parseInt(transactionData.amount, 10),
          reason: transactionData.reason
        });
        setMsgTransaction({ type: 'success', text: 'Selos enviados com sucesso!' });
      } else {
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

        {/* --- LISTAGEM DAS ATIVIDADES CADASTRADAS --- */}
        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>Atividades Cadastradas</h3>
          
          {loadingList ? (
            <p style={{ color: '#ea580c' }}>A carregar catálogo...</p>
          ) : activities.length === 0 ? (
            <p style={{ color: '#64748b' }}>A sua OSC ainda não tem atividades cadastradas no catálogo.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.activityTable}>
                <thead>
                  <tr>
                    <th>Nome da Atividade</th>
                    <th>Forma de Validação</th>
                    <th style={{ textAlign: 'center' }}>Selos</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(act => {
                    // VERIFICAÇÃO DE BLOQUEIO: Se há alguma prova pendente com o ID desta atividade
                    const isLocked = pendingProofs.some(p => String(p.activity_id) === String(act.id));
                    
                    return (
                      <tr key={act.id}>
                        <td><strong>{act.description}</strong></td>
                        <td>{act.validation_method || 'Validação manual (Padrão)'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ea580c' }}>{act.seal_value}</td>
                        <td style={{ textAlign: 'right' }}>
                          {isLocked ? (
                            <span className={styles.lockedWarning} title="Existem provas pendentes. Avalie-as antes de editar.">
                              🔒 Bloqueado (Em Análise)
                            </span>
                          ) : (
                            <div className={styles.actionButtons}>
                              <button className={styles.editBtn} onClick={() => openEditModal(act)}>Editar</button>
                              <button className={styles.deleteBtn} onClick={() => handleDeleteActivity(act.id)}>Excluir</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- MODAL DE EDIÇÃO DE ATIVIDADE --- */}
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Atividade">
          {activityToEdit && (
            <div className={styles.modalContent}>
              {msgEdit.text && (
                <div className={msgEdit.type === 'success' ? styles.successMessage : styles.errorMessage}>
                  {msgEdit.text}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                  <label>Nome da Atividade *</label>
                  <input type="text" name="description" required value={activityToEdit.description} onChange={handleEditChange} />
                </div>
                
                <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                  <label>Quantidade de Selos *</label>
                  <input type="number" name="seal_value" min="1" required value={activityToEdit.seal_value} onChange={handleEditChange} />
                </div>
                
                <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                  <label>Forma de Validação (Opcional)</label>
                  <input type="text" name="validation_method" value={activityToEdit.validation_method || ''} onChange={handleEditChange} />
                </div>
                
                <div className={styles.formActions} style={{ gap: '10px' }}>
                  <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loadingEdit} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                    {loadingEdit ? 'A Salvar...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>

        {/* --- MODAL UNIFICADO (ENVIO OU DÉBITO) --- */}
        <Modal isOpen={modalType !== null} onClose={() => setModalType(null)} title={modalType === 'send' ? "Enviar Selos para Famílias" : "Debitar Selos de Beneficiário"}>
          <div className={styles.modalContent}>
            
            {msgTransaction.text && (
              <div className={msgTransaction.type === 'success' ? styles.successMessage : styles.errorMessage}>
                {msgTransaction.text}
              </div>
            )}

            <form onSubmit={handleTransactionSubmit}>
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
                      <input type="text" placeholder="Pesquise por Nome, CPF ou ID..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} autoComplete="off" />
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