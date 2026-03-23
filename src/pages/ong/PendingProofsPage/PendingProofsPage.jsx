import React, { useState, useEffect } from 'react';
import styles from './PendingProofsPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import api from '../../../api/api';

// Deteta se está a rodar no localhost ou no servidor de produção para corrigir as imagens
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const IMAGE_BASE_URL = isLocalhost ? 'http://localhost:5000' : 'https://selocidadania.org.br';

const PendingProofsPage = ({ currentUser }) => {
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('');
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const isOsc = !!(currentUser?.ong_id || (currentUser?.role === 'osc'));
  const defaultOngId = currentUser?.ong_id || currentUser?.id;

  useEffect(() => {
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
      // Envia o adminId para registar no log de auditoria
      await api.put(`/proofs/${proofId}/approve`, { adminId: currentUser.id });
      alert('Prova aprovada com sucesso! Selos creditados.');
      fetchPendingProofs(); 
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao aprovar a prova.");
    }
  };

  const handleReject = async (proofId) => {
    const feedback = window.prompt("Motivo da rejeição (opcional, mas recomendado):");
    if (feedback === null) return;
    
    try {
      if (feedback.trim() !== "") {
        await api.put(`/proofs/${proofId}/message`, { message: feedback });
      }
      // Envia o adminId para registar no log de auditoria
      await api.put(`/proofs/${proofId}/reject`, { adminId: currentUser.id });
      alert('Prova rejeitada.');
      fetchPendingProofs(); 
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao rejeitar a prova.");
    }
  };

  const renderImages = (fileUrls) => {
    if (!fileUrls || fileUrls.length === 0) return <p className={styles.noImage}>Sem imagens anexadas</p>;
    
    return (
      <div className={styles.imageGallery}>
        {fileUrls.map((url, index) => {
          // Usa a URL base correta (localhost vs servidor de produção)
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

  // Agrupa as provas por utilizador
  const groupedProofs = pendingProofs.reduce((acc, proof) => {
    const userName = proof.userName || 'Utilizador Desconhecido';
    if (!acc[userName]) acc[userName] = [];
    acc[userName].push(proof);
    return acc;
  }, {});

  return (
    <ContentWrapper title="Análise de Provas Sociais">
      <div className={styles.container}>
        
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
          ) : pendingProofs.length === 0 ? (
            <p className={styles.emptyMessage}>
              {selectedOng 
                ? "Fantástico! Não há provas pendentes de análise no momento." 
                : "Selecione uma organização para ver as provas pendentes."}
            </p>
          ) : (
            // Renderização Agrupada por Utilizador
            <div className={styles.usersContainer}>
              {Object.entries(groupedProofs).map(([userName, proofs]) => (
                <div key={userName} className={styles.userGroup}>
                  
                  {/* Cabeçalho do Utilizador */}
                  <div className={styles.userGroupHeader}>
                    <div className={styles.userInfo}>
                      <span className={styles.userAvatar}>{userName.charAt(0).toUpperCase()}</span>
                      <h4 className={styles.userNameTitle}>{userName}</h4>
                    </div>
                    <span className={styles.userProofCount}>{proofs.length} envio(s)</span>
                  </div>

                  {/* Grid de Provas deste utilizador */}
                  <div className={styles.grid}>
                    {proofs.map(proof => (
                      <div key={proof.id} className={styles.proofCard}>
                        
                        <div className={styles.proofHeader}>
                          <h5>{proof.title}</h5>
                        </div>
                        
                        <div className={styles.proofBody}>
                          <p className={styles.description}>
                            <strong>Comentário do Utilizador:</strong> {proof.description || "Nenhum comentário."}
                          </p>
                          
                          <div className={styles.attachments}>
                            <strong>Comprovativos:</strong>
                            {renderImages(proof.file_urls)}
                            <small className={styles.helperText}>* Clique na imagem para ampliar</small>
                          </div>
                        </div>

                        <div className={styles.cardActions}>
                          <button type="button" onClick={() => handleApprove(proof.id)} className={styles.approveBtn}>
                            Aprovar 
                          </button>
                          <button type="button" onClick={() => handleReject(proof.id)} className={styles.rejectBtn}>
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </ContentWrapper>
  );
};

export default PendingProofsPage;