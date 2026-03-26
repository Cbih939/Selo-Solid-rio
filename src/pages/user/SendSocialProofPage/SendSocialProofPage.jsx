import React, { useState, useEffect } from 'react';
import styles from './SendSocialProofPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';

const SendSocialProofPage = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  
  const [fullUserInfo, setFullUserInfo] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  // 1. Buscar as atividades
  useEffect(() => {
    if (user && user.ong_id) {
      api.get(`/proofs/activities/ong/${user.ong_id}`)
        .then(res => setActivities(res.data))
        .catch(err => console.error("Erro ao buscar atividades", err));
    }
  }, [user]);

  // 2. Buscar dados completos do utilizador
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get(`/users/${user.id}`);
        setFullUserInfo(res.data);
        // Define o titular como selecionado por padrão, usando uma verificação segura de nome
        const userName = res.data.name || res.data.full_name || "Utilizador";
        setSelectedParticipants([userName]); 
      } catch (err) {
        console.error("Erro ao buscar dados do usuário", err);
      } finally {
        setFetchingUser(false);
      }
    };
    if (user?.id) fetchUserData();
  }, [user]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleParticipantToggle = (name) => {
    if (!name) return;
    setSelectedParticipants(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActivity) return alert("Selecione uma atividade.");
    if (files.length === 0) return alert("Anexe pelo menos uma imagem.");
    if (selectedParticipants.length === 0) return alert("Marque pelo menos uma pessoa que participou.");

    setLoading(true);
    const formData = new FormData();
    formData.append('description', description);
    formData.append('userId', user.id);
    formData.append('ongId', user.ong_id);
    formData.append('activity_id', selectedActivity);
    formData.append('participants', JSON.stringify(selectedParticipants));

    files.forEach(file => {
      formData.append('proof_files', file);
    });

    try {
      await api.post('/proofs', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Prova social enviada com sucesso! Aguarde a avaliação.');
      setSelectedActivity('');
      setDescription('');
      setFiles([]);
      const defaultName = fullUserInfo?.name || fullUserInfo?.full_name || "";
      setSelectedParticipants([defaultName]);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar prova social.');
    } finally {
      setLoading(false);
    }
  };

  const currentActivityObj = activities.find(a => a.id.toString() === selectedActivity);

  // Função auxiliar para renderizar iniciais de forma segura
  const renderInitials = (name) => {
    if (!name || typeof name !== 'string') return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <ContentWrapper title="Nova Prova Social">
      <div className={styles.container}>
        
        <div className={styles.headerBox}>
          <h3>Registro de Atividade</h3>
          <p>Siga os 3 passos abaixo para enviar o seu comprovativo e ganhar selos.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* PASSO 1: ATIVIDADE */}
          <div className={styles.stepSection}>
            <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>1</span>
                <h4>Qual atividade realizou?</h4>
            </div>
            
            <div className={styles.activitySelectWrapper}>
              <select 
                value={selectedActivity} 
                onChange={(e) => setSelectedActivity(e.target.value)} 
                required
                className={styles.select}
              >
                <option value="">Selecione uma opção de ação que gera selo...</option>
                {activities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.description} (+{act.seal_value} Selos)
                  </option>
                ))}
              </select>
              
              {selectedActivity && (
                <button 
                  type="button" 
                  className={styles.tipBtn} 
                  onClick={() => setIsTipModalOpen(true)}
                  title="Ver dicas para esta atividade"
                >
                  💡 Ver Dicas
                </button>
              )}
            </div>
          </div>

          {/* PASSO 2: PARTICIPANTES */}
          <div className={styles.stepSection}>
            <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>2</span>
                <h4>Quem está executando essa ação?</h4>
            </div>
            <p className={styles.helperText}>Selecione todas as pessoas da família que participaram nesta ação.</p>

            {fetchingUser ? (
              <p className={styles.loadingText}>A carregar a sua família...</p>
            ) : fullUserInfo ? (
              <div className={styles.participantsGrid}>
                
                {/* Cartão do Titular */}
                {(() => {
                  const titularName = fullUserInfo.name || fullUserInfo.full_name || "Titular";
                  return (
                    <label className={`${styles.participantCard} ${selectedParticipants.includes(titularName) ? styles.selectedCard : ''}`}>
                      <input 
                        type="checkbox" 
                        className={styles.hiddenCheckbox}
                        checked={selectedParticipants.includes(titularName)}
                        onChange={() => handleParticipantToggle(titularName)}
                      />
                      <div className={styles.avatarBox}>
                          {fullUserInfo.profile_photo ? 
                              <img src={fullUserInfo.profile_photo} alt="Eu" className={styles.avatarImg} /> : 
                              <span className={styles.avatarInitials}>{renderInitials(titularName)}</span>
                          }
                      </div>
                      <div className={styles.participantInfo}>
                        <strong>Eu (Titular)</strong>
                        <span>{titularName}</span>
                      </div>
                      <div className={styles.checkIcon}>✓</div>
                    </label>
                  );
                })()}

                {/* Cartões dos Dependentes */}
                {fullUserInfo.dependents && fullUserInfo.dependents.map((dep, idx) => {
                  const depName = dep.full_name || dep.name || `Dependente ${idx + 1}`;
                  return (
                    <label key={idx} className={`${styles.participantCard} ${selectedParticipants.includes(depName) ? styles.selectedCard : ''}`}>
                      <input 
                        type="checkbox" 
                        className={styles.hiddenCheckbox}
                        checked={selectedParticipants.includes(depName)}
                        onChange={() => handleParticipantToggle(depName)}
                      />
                      <div className={styles.avatarBox}>
                          {dep.profile_photo ? 
                              <img src={dep.profile_photo} alt={depName} className={styles.avatarImg} /> : 
                              <span className={styles.avatarInitials}>{renderInitials(depName)}</span>
                          }
                      </div>
                      <div className={styles.participantInfo}>
                        <strong>{dep.kinship || 'Dependente'}</strong>
                        <span>{depName}</span>
                      </div>
                      <div className={styles.checkIcon}>✓</div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className={styles.errorText}>Erro ao carregar dados. Tente atualizar a página.</p>
            )}
          </div>

          {/* PASSO 3: COMPROVATIVOS E ENVIO */}
          <div className={styles.stepSection}>
            <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>3</span>
                <h4>Anexos e Detalhes</h4>
            </div>

            <div className={styles.uploadArea}>
                <div className={styles.inputGroup}>
                    <label>Comentário (Opcional)</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows="3"
                        placeholder="Conte-nos como foi a experiência..."
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Fotografias Comprovativas *</label>
                    <div className={styles.fileUploadBox}>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} required id="file-upload" className={styles.hiddenCheckbox}/>
                        <label htmlFor="file-upload" className={styles.fileLabel}>
                            <span className={styles.uploadIcon}>📸</span>
                            <span className={styles.uploadMainText}>Clique para selecionar as fotos</span>
                            <small className={styles.uploadSubText}>Formatos aceites: JPG ou PNG</small>
                        </label>
                    </div>
                    
                    {files.length > 0 && (
                        <div className={styles.selectedFiles}>
                            <div className={styles.selectedHeader}>Fotos prontas a enviar:</div>
                            <div className={styles.fileChips}>
                                {files.map((f, i) => (
                                    <span key={i} className={styles.fileChip}>📄 {f.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'A processar envio...' : 'Concluir e Enviar Prova 🚀'}
          </button>

        </form>
      </div>

      {/* MODAL DE DICAS DE ENVIO */}
      <Modal isOpen={isTipModalOpen} onClose={() => setIsTipModalOpen(false)} title="💡 Como realizar esta atividade">
        <div className={styles.tipModalContent}>
          <h4 className={styles.tipTitle}>{currentActivityObj?.description}</h4>
          <p className={styles.tipIntro}>Para garantir que a sua prova social seja aprovada rapidamente pela sua organização, siga estas dicas ao tirar a fotografia:</p>
          
          <ul className={styles.tipList}>
            <li><strong>Claridade:</strong> Certifique-se de que o local está bem iluminado.</li>
            <li><strong>Participantes:</strong> As pessoas que marcou no formulário devem estar visíveis na foto.</li>
            <li><strong>Ação:</strong> A foto deve mostrar a atividade a ser realizada (ex: se é uma consulta médica, mostre a frente do posto de saúde ou o documento).</li>
            <li><strong>Qualidade:</strong> Evite fotos desfocadas ou cortadas.</li>
          </ul>

          <div className={styles.tipImages}>
            <div className={styles.tipImageCard}>
                <div className={styles.tipImagePlaceholderGreen}>✅ Foto Correta</div>
                <small>Rosto visível, boa luz e ação clara.</small>
            </div>
            <div className={styles.tipImageCard}>
                <div className={styles.tipImagePlaceholderRed}>❌ Foto Incorreta</div>
                <small>Desfocada, escura ou sem mostrar a ação.</small>
            </div>
          </div>

          <button className={styles.closeTipBtn} onClick={() => setIsTipModalOpen(false)}>Entendido!</button>
        </div>
      </Modal>

    </ContentWrapper>
  );
};

export default SendSocialProofPage;