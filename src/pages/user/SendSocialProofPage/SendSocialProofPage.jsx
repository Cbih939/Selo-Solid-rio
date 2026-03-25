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
  
  // ++ NOVOS ESTADOS ++
  const [fullUserInfo, setFullUserInfo] = useState(null); // Para carregar os dependentes
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  // 1. Buscar as atividades da OSC do usuário
  useEffect(() => {
    if (user && user.ong_id) {
      api.get(`/proofs/activities/ong/${user.ong_id}`)
        .then(res => setActivities(res.data))
        .catch(err => console.error("Erro ao buscar atividades", err));
    }
  }, [user]);

  // 2. Buscar os dados completos do usuário (para listar os dependentes)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get(`/users/${user.id}`);
        setFullUserInfo(res.data);
        // Marca o titular por defeito
        setSelectedParticipants([res.data.name]); 
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

  // Gerir as Checkboxes de quem participou
  const handleParticipantToggle = (name) => {
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
    
    // Envia o array de participantes como uma string JSON
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
      setSelectedParticipants([fullUserInfo?.name]); // Reset
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar prova social.');
    } finally {
      setLoading(false);
    }
  };

  // Encontra a atividade selecionada para mostrar detalhes no Modal de Dicas
  const currentActivityObj = activities.find(a => a.id.toString() === selectedActivity);

  return (
    <ContentWrapper title="Enviar Prova Social">
      <div className={styles.container}>
        <div className={styles.headerBox}>
          <h3>Registe a sua Atividade</h3>
          <p>Selecione a atividade que realizou, marque quem participou na foto e anexe os comprovativos para ganhar os seus selos!</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* SELEÇÃO DA ATIVIDADE + ÍCONE DE DICA */}
          <div className={styles.inputGroup}>
            <label>Qual atividade realizou?</label>
            <div className={styles.activitySelectWrapper}>
              <select 
                value={selectedActivity} 
                onChange={(e) => setSelectedActivity(e.target.value)} 
                required
                className={styles.select}
              >
                <option value="">Selecione uma atividade...</option>
                {activities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.description} (+{act.seal_value} Selos)
                  </option>
                ))}
              </select>
              
              {/* Botão de Dica (Só aparece se tiver atividade selecionada) */}
              {selectedActivity && (
                <button 
                  type="button" 
                  className={styles.tipBtn} 
                  onClick={() => setIsTipModalOpen(true)}
                  title="Ver dicas de como tirar a foto"
                >
                  💡 Dicas
                </button>
              )}
            </div>
          </div>

          {/* LISTA DE PARTICIPANTES (CHECKBOXES) */}
          <div className={styles.participantsSection}>
            <label className={styles.sectionLabel}>Quem participou desta prova social? (Marque quem aparece na foto)</label>
            {fetchingUser ? (
              <p className={styles.loadingText}>A carregar a sua família...</p>
            ) : fullUserInfo ? (
              <div className={styles.checkboxGrid}>
                {/* Titular */}
                <label className={styles.checkboxItem}>
                  <input 
                    type="checkbox" 
                    checked={selectedParticipants.includes(fullUserInfo.name)}
                    onChange={() => handleParticipantToggle(fullUserInfo.name)}
                  />
                  <div className={styles.checkboxContent}>
                    <strong>Eu (Titular)</strong>
                    <span>{fullUserInfo.name}</span>
                  </div>
                </label>

                {/* Dependentes */}
                {fullUserInfo.dependents && fullUserInfo.dependents.map((dep, idx) => (
                  <label key={idx} className={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      checked={selectedParticipants.includes(dep.name)}
                      onChange={() => handleParticipantToggle(dep.name)}
                    />
                    <div className={styles.checkboxContent}>
                      <strong>{dep.kinship || 'Dependente'}</strong>
                      <span>{dep.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.errorText}>Erro ao carregar dados. Tente atualizar a página.</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Comentário (Opcional)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows="3"
              placeholder="Conte-nos um pouco sobre como foi a atividade..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Anexar Fotografia(s) *</label>
            <div className={styles.fileUploadBox}>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} required id="file-upload" className={styles.fileInputHidden}/>
              <label htmlFor="file-upload" className={styles.fileLabel}>
                <span className={styles.uploadIcon}>📸</span>
                <span>Clique aqui para escolher as fotos</span>
                <small>Formatos aceites: JPG, PNG</small>
              </label>
            </div>
            {files.length > 0 && (
              <div className={styles.selectedFiles}>
                <strong>Fotos selecionadas:</strong>
                <ul>{files.map((f, i) => <li key={i}>{f.name}</li>)}</ul>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'A Enviar...' : 'Enviar Prova Social'}
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