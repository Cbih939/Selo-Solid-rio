// Arquivo: src/pages/user/MySocialProofsPage/MySocialProofsPage.jsx

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

  // Estados para o reenvio de provas (Correção)
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [selectedProofToResubmit, setSelectedProofToResubmit] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [newDescription, setNewDescription] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      fetchProofs();
    }
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
      case 'approved':
        return { label: 'Aprovada', styleClass: styles.statusApproved, icon: '✅' };
      case 'rejected':
        return { label: 'Rejeitada', styleClass: styles.statusRejected, icon: '❌' };
      case 'needs_correction':
        return { label: 'Requer Correção', styleClass: styles.statusWarning, icon: '⚠️' };
      default:
        return { label: 'Em Análise', styleClass: styles.statusPending, icon: '⏳' };
    }
  };

  const renderImages = (fileUrls) => {
    if (!fileUrls || fileUrls.length === 0) return <p className={styles.noImage}>Nenhuma imagem anexada.</p>;
    return (
      <div className={styles.imageGallery}>
        {fileUrls.map((url, index) => {
          const fullUrl = `${IMAGE_BASE_URL}${url}`;
          return (
            <a key={index} href={fullUrl} target="_blank" rel="noopener noreferrer">
              <img src={fullUrl} alt={`Comprovativo ${index + 1}`} className={styles.proofImage} />
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

  // --- LÓGICA DE REENVIO DE PROVA (CORREÇÃO) ---
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
      // Usa uma rota PUT ou POST específica para reenviar a prova.
      // Assumindo que você tem uma rota para atualizar a prova no backend
      await api.put(`/proofs/${selectedProofToResubmit.id}/resubmit-by-user`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Prova reenviada com sucesso! Em breve será avaliada novamente.');
      setResubmitModalOpen(false);
      fetchProofs(); // Recarrega a lista
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao reenviar a prova.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return <ContentWrapper title="Minhas Provas Sociais"><p>A carregar o seu histórico...</p></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Minhas Provas Sociais"><p className={styles.errorText}>{error}</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Minhas Provas Sociais">
      <div className={styles.container}>
        <p className={styles.introText}>Acompanhe o estado de todas as provas sociais que enviou.</p>

        {proofs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Ainda não enviou nenhuma prova social.</p>
          </div>
        ) : (
          <div className={styles.proofsGrid}>
            {proofs.map(proof => {
              const statusInfo = getStatusInfo(proof.status);
              
              return (
                <div key={proof.id} className={styles.proofCard}>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.proofTitle}>{proof.title}</h4>
                    <span className={`${styles.statusBadge} ${statusInfo.styleClass}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Enviado em:</span>
                      <span className={styles.infoValue}>{formatDate(proof.created_at)}</span>
                    </div>

                    {proof.description && (
                      <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>O seu comentário:</span>
                        <p className={styles.infoText}>{proof.description}</p>
                      </div>
                    )}

                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>Comprovativos enviados:</span>
                      {renderImages(proof.file_urls)}
                    </div>

                    {/* MENSAGEM DE FEEDBACK DO ADMINISTRADOR */}
                    {(proof.status === 'rejected' || proof.status === 'needs_correction') && proof.feedback_message && (
                      <div className={`${styles.feedbackBlock} ${proof.status === 'rejected' ? styles.feedbackError : styles.feedbackWarning}`}>
                        <span className={styles.feedbackTitle}>Mensagem do Avaliador:</span>
                        <p className={styles.feedbackText}>"{proof.feedback_message}"</p>
                      </div>
                    )}

                    {/* DADOS DE AVALIAÇÃO */}
                    {proof.status !== 'pending' && proof.status !== 'needs_correction' && (
                      <div className={styles.evalInfo}>
                        <span>Avaliado em: {formatDate(proof.evaluated_at)}</span>
                        {proof.evaluator_name && <span>Por: {proof.evaluator_name}</span>}
                      </div>
                    )}
                  </div>

                  {/* BOTÃO PARA REENVIAR (Se o status for 'needs_correction') */}
                  {proof.status === 'needs_correction' && (
                    <div className={styles.cardFooter}>
                      <button className={styles.actionBtn} onClick={() => openResubmitModal(proof)}>
                        Reenviar Comprovativos
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PARA REENVIO DE PROVA (CORREÇÃO) */}
      <Modal isOpen={resubmitModalOpen} onClose={() => setResubmitModalOpen(false)} title="Reenviar Prova Social">
        {selectedProofToResubmit && (
          <form className={styles.resubmitForm} onSubmit={handleResubmit}>
            <p className={styles.modalIntro}>
              A sua prova para a atividade <strong>{selectedProofToResubmit.title}</strong> requer correção. Por favor, anexe as imagens corretas abaixo.
            </p>

            <div className={styles.inputGroup}>
              <label>Comentário (opcional):</label>
              <textarea 
                value={newDescription} 
                onChange={(e) => setNewDescription(e.target.value)} 
                rows={3} 
                placeholder="Adicione um novo comentário..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Novos Comprovativos (obrigatório):</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange} 
                required 
                className={styles.fileInput}
              />
              <small className={styles.helperText}>Pode selecionar várias imagens.</small>
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