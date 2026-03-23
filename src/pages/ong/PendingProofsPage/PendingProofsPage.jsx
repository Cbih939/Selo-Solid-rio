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
  
  // NOVO: Estado para gerir qual utilizador está a ser analisado no momento
  const [selectedUser, setSelectedUser] = useState(null);
  
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
      setSelectedUser(null); // Limpa o utilizador selecionado ao trocar de OSC
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

  // Efeito para voltar à lista automaticamente se o utilizador atual ficar sem provas pendentes
  useEffect(() => {
    if (selectedUser) {
      const stillHasProofs = pendingProofs.some(p => (p.userName || 'Utilizador Desconhecido') === selectedUser);
      if (!stillHasProofs) {
        setSelectedUser(null);
      }
    }
  }, [pendingProofs, selectedUser]);

  const handleApprove = async (proofId) => {
    if (!window.confirm("Confirmar a aprovação desta prova? Os selos serão creditados ao utilizador.")) return;
    
    try {
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

  // Ordena os nomes dos utilizadores de A a Z
  const sortedUsers = Object.keys(groupedProofs).sort((a, b) => a.localeCompare(b));

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

        {(!isOsc || pendingProofs.length > 0) && <hr className={styles.divider} />}

        <div className={styles.listSection}>
          
          {loading ? (
            <p className={styles.loadingText}>A carregar provas pendentes...</p>
          ) : pendingProofs.length === 0 ? (
            <p className={styles.emptyMessage}>
              {selectedOng 
                ? "Fantástico! Não há provas pendentes de análise no momento." 
                : "Selecione uma organização para ver as provas pendentes."}
            </p>
          ) : !selectedUser ? (
            
            /* TELA 1: LISTA DE USUÁRIOS (A-Z) */
            <>
              <div className={styles.listHeader}>
                <h3 className={styles.subtitle}>Selecione um utilizador para avaliar</h3>
                <span className={styles.badgeCount}>{pendingProofs.length} provas no total</span>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th>Nome do Utilizador (A-Z)</th>
                      <th className={styles.textCenter}>Provas Pendentes</th>
                      <th className={styles.textRight}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(userName => (
                      <tr key={userName}>
                        <td className={styles.userNameCell}>
                          <span className={styles.userAvatarSm}>{userName.charAt(0).toUpperCase()}</span>
                          {userName}
                        </td>
                        <td className={styles.textCenter}>
                          <span className={styles.pill}>{groupedProofs[userName].length}</span>
                        </td>
                        <td className={styles.textRight}>
                          <button 
                            className={styles.analyzeBtn}
                            onClick={() => setSelectedUser(userName)}
                          >
                            Ver Provas ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>

          ) : (

            /* TELA 2: PROVAS DO USUÁRIO SELECIONADO */
            <>
              <div className={styles.detailHeader}>
                <button className={styles.backBtn} onClick={() => setSelectedUser(null)}>
                  ⬅ Voltar para a lista
                </button>
                <div className={styles.userInfoLg}>
                  <h3 className={styles.subtitle}>Analisar provas de: <span className={styles.highlightName}>{selectedUser}</span></h3>
                  <span className={styles.badgeCount}>{groupedProofs[selectedUser]?.length} pendente(s)</span>
                </div>
              </div>

              <div className={styles.grid}>
                {groupedProofs[selectedUser]?.map(proof => (
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
            </>
          )}

        </div>
      </div>
    </ContentWrapper>
  );
};

export default PendingProofsPage;