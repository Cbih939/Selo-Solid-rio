import React, { useState, useEffect } from 'react';
import styles from './MySocialProofsPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const IMAGE_BASE_URL = isLocalhost ? 'http://localhost:5000' : 'https://selocidadania.org.br';

const MySocialProofsPage = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [selectedProofToResubmit, setSelectedProofToResubmit] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [newDescription, setNewDescription] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      fetchProofs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/proofs/user/${user.id}`);
      setProofs(response.data);
    } catch (err) {
      console.error("Erro ao buscar provas sociais:", err);
      setError("Não foi possível carregar as suas provas sociais.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved': return { label: 'Aprovada', styleClass: styles.statusApproved, icon: '✅' };
      case 'rejected': return { label: 'Rejeitada', styleClass: styles.statusRejected, icon: '❌' };
      case 'needs_correction': return { label: 'Requer Correção', styleClass: styles.statusWarning, icon: '⚠️' };
      default: return { label: 'Em Análise', styleClass: styles.statusPending, icon: '⏳' };
    }
  };

  const parseParticipants = (participantsData) => {
    if (!participantsData) return [];
    if (Array.isArray(participantsData)) return participantsData;
    try {
      return JSON.parse(participantsData);
    } catch (e) {
      return [];
    }
  };

  const renderImages = (fileUrls) => {
    if (!fileUrls || fileUrls.length === 0) return <p className={styles.noImage}>Nenhuma imagem anexada.</p>;
    return (
      <div className={styles.imageGallery}>
        {fileUrls.map((url, index) => {
          const fullUrl = `${IMAGE_BASE_URL}${url}`;
          return (
            <a key={index} href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.imageLink}>
              <img src={fullUrl} alt={`Comprovativo ${index + 1}`} className={styles.proofImage} />
              <div className={styles.imageOverlay}>🔍 Ampliar</div>
            </a>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openResubmitModal = (proof) => {
    setSelectedProofToResubmit(proof);
    setNewDescription(proof.description || '');
    setNewFiles([]);
    setResubmitModalOpen(true);
  };

  const handleFileChange = (e) => {
    setNewFiles(Array.from(e.target.files));
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (newFiles.length === 0) {
      alert("Por favor, anexe as novas imagens (comprovativos).");
      return;
    }

    setResubmitting(true);
    const formData = new FormData();
    formData.append('description', newDescription);
    newFiles.forEach(file => {
      formData.append('proof_files', file);
    });

    try {
      await api.put(`/proofs/${selectedProofToResubmit.id}/resubmit-by-user`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Prova reenviada com sucesso! Em breve será avaliada novamente.');
      setResubmitModalOpen(false);
      fetchProofs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao reenviar a prova.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return <ContentWrapper title="Minhas Provas Sociais"><div className={styles.loadingContainer}><p className={styles.loadingText}>A carregar o seu histórico...</p></div></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Minhas Provas Sociais"><div className={styles.errorContainer}><p className={styles.errorText}>{error}</p></div></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Minhas Provas Sociais">
      <div className={styles.container}>
        
        <div className={styles.headerSection}>
          <p className={styles.introText}>Acompanhe o estado de todas as provas sociais que enviou e verifique se alguma precisa de correção.</p>
        </div>

        {proofs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📂</div>
            <h3>Ainda não enviou nenhuma prova social</h3>
            <p>Vá até à aba "Enviar Prova Social" para registar a sua primeira atividade!</p>
          </div>
        ) : (
          <div className={styles.proofsGrid}>
            {proofs.map(proof => {
              const statusInfo = getStatusInfo(proof.status);
              const participantsList = parseParticipants(proof.participants);
              
              return (
                <div key={proof.id} className={`${styles.proofCard} ${proof.status === 'needs_correction' ? styles.cardWarning : ''}`}>
                  
                  {/* CABEÇALHO DO CARTÃO */}
                  <div className={styles.cardHeader}>
                    <h4 className={styles.proofTitle}>{proof.title}</h4>
                    <span className={`${styles.statusBadge} ${statusInfo.styleClass}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  {/* CORPO DO CARTÃO */}
                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Enviado em:</span>
                      <span className={styles.infoValue}>{formatDate(proof.created_at)}</span>
                    </div>

                    {/* PARTICIPANTES (Nova Funcionalidade) */}
                    {participantsList.length > 0 && (
                      <div className={styles.participantsBlock}>
                        <span className={styles.infoLabel}>Participantes na Ação:</span>
                        <div className={styles.participantsChips}>
                          {participantsList.map((person, idx) => (
                            <span key={idx} className={styles.chip}>👤 {person}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {proof.description && (
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>O seu comentário:</span>
                        <p className={styles.infoText}>{proof.description}</p>
                      </div>
                    )}

                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>Comprovativos:</span>
                      {renderImages(proof.file_urls)}
                    </div>

                    {/* FEEDBACK DO ADMINISTRADOR */}
                    {(proof.status === 'rejected' || proof.status === 'needs_correction') && proof.feedback_message && (
                      <div className={`${styles.feedbackBlock} ${proof.status === 'rejected' ? styles.feedbackError : styles.feedbackWarning}`}>
                        <span className={styles.feedbackTitle}>Mensagem da Organização:</span>
                        <p className={styles.feedbackText}>"{proof.feedback_message}"</p>
                      </div>
                    )}
                  </div>

                  {/* RODAPÉ: AVALIADOR OU BOTÃO DE REENVIO */}
                  <div className={styles.cardFooter}>
                    {proof.status === 'needs_correction' ? (
                      <button className={styles.actionBtn} onClick={() => openResubmitModal(proof)}>
                        Corrigir e Reenviar Comprovativos ➔
                      </button>
                    ) : proof.status !== 'pending' ? (
                      <div className={styles.evalInfo}>
                        <span><strong>Avaliado em:</strong> {formatDate(proof.evaluated_at)}</span>
                        {proof.evaluator_name && <span><strong>Por:</strong> {proof.evaluator_name}</span>}
                      </div>
                    ) : (
                      <div className={styles.evalInfoPending}>
                         A aguardar avaliação da sua organização...
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PARA REENVIO DE PROVA */}
      <Modal isOpen={resubmitModalOpen} onClose={() => setResubmitModalOpen(false)} title="Reenviar Prova Social">
        {selectedProofToResubmit && (
          <form className={styles.resubmitForm} onSubmit={handleResubmit}>
            <div className={styles.modalAlert}>
               <strong>Atenção:</strong> A sua prova para a atividade "{selectedProofToResubmit.title}" requer correção. Anexe as novas imagens abaixo.
            </div>

            <div className={styles.inputGroup}>
              <label>Comentário Adicional (Opcional):</label>
              <textarea 
                value={newDescription} 
                onChange={(e) => setNewDescription(e.target.value)} 
                rows={3} 
                placeholder="Ex: Segue a foto corrigida e mais nítida..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Novos Comprovativos (Obrigatório):</label>
              <div className={styles.fileUploadBox}>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} required id="resubmit-file" className={styles.hiddenFile}/>
                  <label htmlFor="resubmit-file" className={styles.fileLabel}>
                      <span className={styles.uploadIcon}>📸</span>
                      <span>Clique para escolher as novas fotos</span>
                  </label>
              </div>
              {newFiles.length > 0 && (
                  <div className={styles.selectedFiles}>
                      <strong>Selecionadas:</strong> {newFiles.length} foto(s).
                  </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setResubmitModalOpen(false)}>Cancelar</button>
              <button type="submit" className={styles.submitBtn} disabled={resubmitting}>
                {resubmitting ? 'A enviar...' : 'Reenviar Prova'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </ContentWrapper>
  );
};

export default MySocialProofsPage;