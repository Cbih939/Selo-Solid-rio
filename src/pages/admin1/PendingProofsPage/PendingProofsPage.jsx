// Arquivo: src/pages/ong/PendingProofsPage/PendingProofsPage.jsx

import React, { useState, useEffect } from 'react';
import styles from './PendingProofsPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const IMAGE_BASE_URL = isLocalhost ? 'http://localhost:3002/api' : 'https://selocidadania.org.br/api';

const PendingProofsPage = ({ currentUser, onNavigate }) => {
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('');
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de controlo de Ações
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', proofId: null });
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOsc = !!(currentUser?.ong_id || (currentUser?.role === 'osc'));
  const defaultOngId = currentUser?.ong_id || currentUser?.id;

  useEffect(() => {
    if (!isOsc) {
      const fetchOngs = async () => {
        try {
          const response = await api.get('/ongs'); 
          setOngs(response.data);
        } catch (error) {
          console.error("Erro ao carregar OSCs:", error);
        }
      };
      fetchOngs();
    } else {
      setSelectedOng(defaultOngId);
    }
  }, [isOsc, defaultOngId]);

  useEffect(() => {
    if (selectedOng) {
      fetchPendingProofs();
      setSelectedUser(null); 
      setSearchTerm(''); 
    } else {
      setPendingProofs([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOng]);

  const fetchPendingProofs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/proofs/pending/${selectedOng}`);
      setPendingProofs(response.data);
    } catch (error) {
      console.error("Erro ao carregar provas pendentes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      const stillHasProofs = pendingProofs.some(p => (p.userName || 'Utilizador Desconhecido') === selectedUser);
      if (!stillHasProofs) setSelectedUser(null);
    }
  }, [pendingProofs, selectedUser]);

  // APROVAR (Ação direta)
  const handleApprove = async (proofId) => {
    if (!window.confirm("Confirmar a aprovação desta prova? Os selos serão creditados na carteira do beneficiário.")) return;
    setIsSubmitting(true);
    try {
      await api.put(`/proofs/${proofId}/approve`, { adminId: currentUser.id });
      fetchPendingProofs(); 
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao aprovar a prova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ABRIR MODAL PARA REJEITAR OU REENVIAR
  const openActionModal = (proofId, type) => {
    setActionModal({ isOpen: true, type, proofId });
    setFeedbackMsg(''); 
  };

  // CONFIRMAR AÇÃO DO MODAL
  const handleConfirmAction = async () => {
    const { type, proofId } = actionModal;
    setIsSubmitting(true);
    try {
      if (type === 'reject') {
        await api.put(`/proofs/${proofId}/reject`, { adminId: currentUser.id, message: feedbackMsg });
      } else if (type === 'resubmit') {
        await api.put(`/proofs/${proofId}/resubmit`, { adminId: currentUser.id, message: feedbackMsg });
      }
      setActionModal({ isOpen: false, type: '', proofId: null });
      fetchPendingProofs();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao processar a ação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // RENDERIZAÇÃO SEGURA DE IMAGENS
  const renderImages = (fileUrls) => {
    if (!fileUrls || fileUrls.length === 0) return <p className={styles.noImage}>Sem imagens anexadas</p>;
    
    let parsedUrls = fileUrls;
    if (typeof fileUrls === 'string') {
      try { parsedUrls = JSON.parse(fileUrls); } 
      catch (e) { parsedUrls = [fileUrls]; }
    }

    return (
      <div className={styles.imageGallery}>
        {parsedUrls.map((url, index) => {
          const cleanUrl = url.startsWith('/') ? url : `/${url}`;
          const fullUrl = `${IMAGE_BASE_URL}${cleanUrl}`;
          return (
            <a key={index} href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.imageWrapper}>
              <img src={fullUrl} alt={`Comprovativo ${index + 1}`} className={styles.proofImage} />
              <div className={styles.imageOverlay}>Ampliar</div>
            </a>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não registada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const groupedProofs = pendingProofs.reduce((acc, proof) => {
    const userName = proof.userName || 'Utilizador Desconhecido';
    if (!acc[userName]) acc[userName] = [];
    acc[userName].push(proof);
    return acc;
  }, {});

  const filteredUsers = Object.keys(groupedProofs)
    .sort((a, b) => a.localeCompare(b))
    .filter(userName => userName.toLowerCase().includes(searchTerm.toLowerCase()));

  const getLatestProofDate = (userName) => {
    const userProofs = groupedProofs[userName];
    if (!userProofs || userProofs.length === 0) return null;
    const dates = userProofs.map(p => new Date(p.created_at || 0).getTime());
    return formatDate(new Date(Math.max(...dates)));
  };

  const selectedUserId = selectedUser && groupedProofs[selectedUser] ? groupedProofs[selectedUser][0].user_id : null;

  return (
    <ContentWrapper title="Análise de Provas Sociais">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Fila de Aprovação</h2>
        <p className={styles.introText}>
          Analise e valide os comprovantes enviados pelos beneficiários. Você pode aprovar (creditando os selos), pedir correção ou rejeitar permanentemente.
        </p>
      </div>

      <div className={styles.container}>
        
        {/* BLOCO DE SELEÇÃO DE OSC (ADMIN) */}
        {!isOsc && (
          <div className={styles.adminSelectorBox}>
            <label className={styles.adminSelectorLabel}>
              🌐 Filtrar fila de análise por Instituição (OSC):
            </label>
            <select 
              className={styles.adminSelect}
              value={selectedOng} 
              onChange={(e) => setSelectedOng(e.target.value)}
            >
              <option value="">Selecione uma organização para começar...</option>
              {ongs.map(ong => (
                <option key={ong.id} value={ong.id}>{ong.fantasy_name || ong.corporate_name}</option>
              ))}
            </select>
          </div>
        )}

        {(!isOsc || pendingProofs.length > 0) && <div style={{ marginBottom: '25px' }}></div>}

        <div className={styles.listSection}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner}></div>
              <p>A carregar provas pendentes...</p>
            </div>
          ) : pendingProofs.length === 0 ? (
            <div className={styles.emptyState}>
              <h3 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '1.5rem' }}>Fantástico! 🎉</h3>
              <p>{selectedOng ? "A fila desta organização está limpa. Não há provas pendentes de análise." : "Selecione uma organização acima para iniciar as análises."}</p>
            </div>
          ) : !selectedUser ? (
            
            /* TELA 1: LISTA DE USUÁRIOS (A-Z) */
            <>
              <div className={styles.listHeader}>
                <div className={styles.headerText}>
                  <h3 className={styles.subtitle}>Utilizadores Aguardando Análise</h3>
                  <span className={styles.badgeCount}>{pendingProofs.length} prova(s) em fila</span>
                </div>
                <div className={styles.searchContainer}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input 
                    type="text" placeholder="Pesquisar por beneficiário..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput}
                  />
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th>Nome do Beneficiário (A-Z)</th>
                      <th className={styles.textCenter}>Último Envio</th>
                      <th className={styles.textCenter}>Pendências</th>
                      <th className={styles.textRight}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(userName => (
                        <tr key={userName}>
                          <td className={styles.userNameCell}>
                            <span className={styles.userAvatarSm}>{userName.charAt(0).toUpperCase()}</span>
                            <strong>{userName}</strong>
                          </td>
                          <td className={styles.textCenter} style={{ color: '#64748b' }}>{getLatestProofDate(userName)}</td>
                          <td className={styles.textCenter}><span className={styles.pill}>{groupedProofs[userName].length}</span></td>
                          <td className={styles.textRight}>
                            <button className={styles.analyzeBtn} onClick={() => setSelectedUser(userName)}>Analisar Provas ➔</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className={styles.emptyStateMsg}>Nenhum utilizador encontrado com o nome "{searchTerm}".</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>

          ) : (

            /* TELA 2: PROVAS DO USUÁRIO SELECIONADO */
            <>
              <div className={styles.detailHeader}>
                <button className={styles.backBtn} onClick={() => setSelectedUser(null)}>⬅ Voltar à Lista</button>
                <div className={styles.userInfoLg}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className={styles.userAvatarMd}>{selectedUser.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 className={styles.subtitle} style={{ margin: 0 }}>{selectedUser}</h3>
                      <span className={styles.badgeCount} style={{ marginTop: '5px', display: 'inline-block' }}>{groupedProofs[selectedUser]?.length} prova(s) aguardam análise</span>
                    </div>
                  </div>
                  
                  {/* BOTÃO EDITAR PERFIL */}
                  {selectedUserId && onNavigate && (
                    <button 
                      className={styles.editProfileBtn} 
                      onClick={() => onNavigate('edit_user_profile', { userId: selectedUserId })}
                      title="Aceder ao Dossiê / Perfil"
                    >
                      📋 Ver Dossiê do Beneficiário
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.grid}>
                {groupedProofs[selectedUser]?.map((proof, index) => (
                  <div key={proof.id} className={styles.proofCard}>
                    <div className={styles.proofHeader}>
                      <div className={styles.proofTitleBlock}>
                        <span className={styles.proofCounter}>#{index + 1}</span>
                        <h5>{proof.title}</h5>
                      </div>
                      <span className={styles.proofDate}>{formatDate(proof.created_at)}</span>
                    </div>
                    
                    <div className={styles.proofBody}>
                      <div className={styles.descriptionBlock}>
                        <strong>💬 Comentário do Beneficiário:</strong> 
                        <p>{proof.description || "Nenhum comentário adicionado."}</p>
                      </div>
                      
                      <div className={styles.attachmentsBlock}>
                        <strong>📎 Comprovantes Anexados:</strong>
                        {renderImages(proof.file_urls)}
                      </div>
                    </div>

                    <div className={styles.cardActionsMulti}>
                      <button type="button" onClick={() => openActionModal(proof.id, 'reject')} className={styles.rejectBtn} disabled={isSubmitting}>✖ Rejeitar</button>
                      <button type="button" onClick={() => openActionModal(proof.id, 'resubmit')} className={styles.resubmitBtn} disabled={isSubmitting}>↩ Pedir Correção</button>
                      <button type="button" onClick={() => handleApprove(proof.id)} className={styles.approveBtn} disabled={isSubmitting}>✅ Aprovar e Creditar</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DE FEEDBACK (REJEITAR / REENVIAR) */}
      <Modal isOpen={actionModal.isOpen} onClose={() => !isSubmitting && setActionModal({ isOpen: false, type: '', proofId: null })} title={actionModal.type === 'reject' ? 'Rejeitar Prova Social' : 'Devolver para Correção'}>
        <div className={styles.feedbackModalContent}>
          
          <div className={actionModal.type === 'reject' ? styles.alertBoxRed : styles.alertBoxYellow}>
            <p className={styles.feedbackInstruction}>
              {actionModal.type === 'reject' 
                ? 'Esta ação é irreversível. A prova será recusada definitivamente. Informe o motivo:'
                : 'A prova será devolvida ao beneficiário para que envie novas fotos ou corrija os dados. Informe o que está em falta:'}
            </p>
          </div>
          
          <div className={styles.textareaWrapper}>
            <textarea 
              className={styles.feedbackTextarea}
              placeholder="Ex: O documento está ilegível. Por favor, envie uma nova fotografia com foco..."
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              maxLength={300}
              rows={4}
              disabled={isSubmitting}
            />
            <span className={styles.charCount}>{feedbackMsg.length} / 300</span>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={() => setActionModal({ isOpen: false, type: '', proofId: null })} disabled={isSubmitting}>Cancelar</button>
            <button 
              className={actionModal.type === 'reject' ? styles.confirmRejectBtn : styles.confirmResubmitBtn} 
              onClick={handleConfirmAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'A Processar...' : (actionModal.type === 'reject' ? 'Confirmar Rejeição' : 'Enviar Pedido de Correção')}
            </button>
          </div>
        </div>
      </Modal>

    </ContentWrapper>
  );
};

export default PendingProofsPage;