// Arquivo: src/pages/admin5/AdminSubmitProofPage/AdminSubmitProofPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './AdminSubmitProofPage.module.css';

// Função para converter arquivo em Base64
const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

const AdminSubmitProofPage = () => {
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('');
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Carregar ONGs e Atividades ao iniciar
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ongsRes, activitiesRes] = await Promise.all([
          api.get('/ongs'),
          api.get('/proofs/activities')
        ]);
        setOngs(ongsRes.data);
        setActivities(activitiesRes.data);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Carregar Usuários quando uma ONG é selecionada
  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedOng) {
        setUsers([]);
        setSelectedUser('');
        return;
      }
      try {
        // Usamos a rota que retorna usuários de uma ONG específica
        const response = await api.get(`/ongs/${selectedOng}/users`);
        setUsers(response.data);
        setSelectedUser(''); // Reset ao trocar de ONG
      } catch (error) {
        console.error("Erro ao carregar beneficiários:", error);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [selectedOng]);

  const handleFileSelect = (selected) => {
    const file = Array.isArray(selected) ? selected[0] : selected;
    setProofFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!selectedUser || !selectedActivity) {
      alert("Por favor, selecione um beneficiário e uma atividade válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      let base64String = null;
      if (proofFile) {
        base64String = await toBase64(proofFile);
      }

      const payload = {
        user_id: selectedUser,
        activity_id: selectedActivity,
        proof_base64: base64String
      };

      const response = await api.post('/proofs/admin-submit', payload);
      
      setSuccessMessage(response.data.message || 'Prova submetida com sucesso!');
      
      // Limpar formulário (mantendo a ONG selecionada para facilitar envios múltiplos)
      setSelectedUser('');
      setSelectedActivity('');
      setProofFile(null);
      setUserSearchTerm('');
      
    } catch (error) {
      console.error("Erro ao submeter prova manual:", error);
      alert(error.response?.data?.error || "Ocorreu um erro ao enviar a prova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtro de pesquisa de beneficiários na combobox
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    (u.cpf && u.cpf.includes(userSearchTerm))
  );

  return (
    <ContentWrapper title="Inserção Manual de Provas Sociais">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Envio Direto de Atividades</h2>
        <p className={styles.introText}>
          Utilize esta ferramenta para submeter provas em nome de beneficiários que não possuem acesso à aplicação móvel ou que participaram de eventos presenciais. <br/>
          <strong style={{color: '#ea580c'}}>Atenção:</strong> Provas enviadas por esta via são automaticamente aprovadas e os selos são creditados imediatamente na carteira do utilizador.
        </p>
      </div>

      <div className={styles.formContainer}>
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        <form onSubmit={handleSubmit} className={styles.submitForm}>
          
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>1. Identificação do Beneficiário</h3>
            
            <div className={styles.grid2}>
              <SelectField 
                label="Passo 1: Selecione a ONG / OSC *" 
                value={selectedOng} 
                onChange={(e) => setSelectedOng(e.target.value)} 
                required
              >
                <option value="">-- Escolha uma Organização --</option>
                {ongs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
              </SelectField>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Passo 2: Pesquisar Beneficiário (Nome ou CPF)</label>
                <input 
                  type="text" 
                  className={styles.searchInput}
                  placeholder="Pesquisar lista abaixo..." 
                  value={userSearchTerm} 
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  disabled={!selectedOng || users.length === 0}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Passo 3: Selecione o Beneficiário Alvo *</label>
              <select 
                className={styles.largeSelect} 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)} 
                required
                disabled={!selectedOng || users.length === 0}
              >
                <option value="">-- Escolha o Utilizador --</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} | CPF: {user.cpf || 'N/A'} | Saldo: {user.seal_balance} Selos
                  </option>
                ))}
              </select>
              {selectedOng && users.length === 0 && <small className={styles.helperText}>Esta ONG não tem beneficiários registados.</small>}
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>2. Atividade e Comprovante</h3>
            
            <SelectField 
              label="Selecione a Atividade Realizada *" 
              value={selectedActivity} 
              onChange={(e) => setSelectedActivity(e.target.value)} 
              required
            >
              <option value="">-- Selecione do Catálogo --</option>
              {activities.map(act => (
                <option key={act.id} value={act.id}>
                  +{act.seal_value} Selos | {act.description}
                </option>
              ))}
            </SelectField>

            <div style={{ marginTop: '20px' }}>
              <FileUpload 
                label="Anexar Comprovante / Foto (Opcional)" 
                onFileSelect={handleFileSelect} 
                accept="image/*,application/pdf" 
              />
              <small className={styles.helperText}>Pode enviar sem anexo caso a validação tenha sido presencial visualmente por um coordenador.</small>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" disabled={isSubmitting} style={{ width: '100%', backgroundColor: '#15803d', borderColor: '#15803d', padding: '15px', fontSize: '1.1rem' }}>
              {isSubmitting ? 'A Processar Envio...' : '✅ Submeter e Aprovar Imediatamente'}
            </Button>
          </div>

        </form>
      </div>

    </ContentWrapper>
  );
};

export default AdminSubmitProofPage;