import React, { useState, useEffect } from 'react';
import styles from './PendingProofsPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const PendingProofsPage = ({ currentUser }) => {
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('');
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Verifica se o utilizador é uma OSC (tem ong_id) ou um Super Admin
  const isOsc = !!(currentUser?.ong_id || (currentUser?.role === 'osc'));
  const defaultOngId = currentUser?.ong_id || currentUser?.id;

  useEffect(() => {
    // Se for Super Admin, carrega a lista de OSCs
    if (!isOsc) {
      const fetchOngs = async () => {
        try {
          const response = await api.get('/proofs/ongs-list');
          setOngs(response.data);
        } catch (error) {
          console.error("Erro ao carregar OSCs:", error);
        }
      };
      fetchOngs();
    } else {
      // Se for OSC, seleciona automaticamente o seu ID
      setSelectedOng(defaultOngId);
    }
  }, [isOsc, defaultOngId]);

  useEffect(() => {
    if (selectedOng) {
      fetchPendingProofs();
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

  const handleApprove = async (proofId) => {
    if (!window.confirm("Confirmar a aprovação desta prova? Os selos serão creditados ao utilizador.")) return;
    
    try {
      await api.put(`/proofs/${proofId}/approve`);
      alert('Prova aprovada com sucesso! Selos creditados.');
      fetchPendingProofs(); // Atualiza a lista
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao aprovar a prova.");
    }
  };

  const handleReject = async (proofId) => {
    const feedback = window.prompt("Motivo da rejeição (opcional, mas recomendado para o utilizador saber o que corrigir):");
    if (feedback === null) return; // Utilizador cancelou o prompt
    
    try {
      if (feedback.trim() !== "") {
        await api.put(`/proofs/${proofId}/message`, { message: feedback });
      }
      await api.put(`/proofs/${proofId}/reject`);
      alert('Prova rejeitada.');
      fetchPendingProofs(); // Atualiza a lista
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao rejeitar a prova.");
    }
  };

  // Função auxiliar para garantir que a imagem é renderizada corretamente
  const renderImages = (fileUrls) => {
    if (!fileUrls || fileUrls.length === 0) return <p className={styles.noImage}>Sem imagens anexadas</p>;
    
    return (
      <div className={styles.imageGallery}>
        {fileUrls.map((url, index) => (
          <a key={index} href={`http://localhost:5000${url}`} target="_blank" rel="noopener noreferrer">
            <img src={`http://localhost:5000${url}`} alt={`Comprovativo ${index + 1}`} className={styles.proofImage} />
          </a>
        ))}
      </div>
    );
  };

  return (
    <ContentWrapper title="Análise de Provas Sociais">
      <div className={styles.container}>
        
        {/* Se não for OSC, mostra o seletor de organizações para o Admin */}
        {!isOsc && (
          <div className={styles.section}>
            <label className={styles.label}>Filtrar provas pendentes por OSC:</label>
            <select 
              className={styles.select}
              value={selectedOng} 
              onChange={(e) => setSelectedOng(e.target.value)}
            >
              <option value="">Selecione uma organização...</option>
              {ongs.map(ong => (
                <option key={ong.id} value={ong.id}>{ong.name}</option>
              ))}
            </select>
          </div>
        )}

        <hr className={styles.divider} />

        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h3 className={styles.subtitle}>Provas a Aguardar Validação</h3>
            <span className={styles.badgeCount}>{pendingProofs.length} pendentes</span>
          </div>

          {loading ? (
            <p className={styles.loadingText}>A carregar provas pendentes...</p>
          ) : (
            <div className={styles.grid}>
              {pendingProofs.length > 0 ? pendingProofs.map(proof => (
                <div key={proof.id} className={styles.proofCard}>
                  
                  <div className={styles.proofHeader}>
                    <h4>{proof.title}</h4>
                    <span className={styles.userName}>Enviado por: <strong>{proof.userName}</strong></span>
                  </div>
                  
                  <div className={styles.proofBody}>
                    <p className={styles.description}>
                      <strong>Comentário do Utilizador:</strong> {proof.description || "Nenhum comentário adicionado."}
                    </p>
                    
                    <div className={styles.attachments}>
                      <strong>Comprovativos:</strong>
                      {renderImages(proof.file_urls)}
                      <small className={styles.helperText}>* Clique na imagem para ampliar</small>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => handleApprove(proof.id)} className={styles.approveBtn}>
                      Aprovar e Atribuir Selos
                    </button>
                    <button type="button" onClick={() => handleReject(proof.id)} className={styles.rejectBtn}>
                      Rejeitar
                    </button>
                  </div>

                </div>
              )) : (
                <p className={styles.emptyMessage}>
                  {selectedOng 
                    ? "Fantástico! Não há provas pendentes de análise no momento." 
                    : "Selecione uma organização para ver as provas pendentes."}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </ContentWrapper>
  );
};

export default PendingProofsPage;