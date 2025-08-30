import React, { useState, useEffect, useRef } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import api from '../../../api/api';
import styles from './SendSocialProofPage.module.css';

// O componente depende da prop 'user' para funcionar.
const SendSocialProofPage = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/proofs/activities');
        const activitiesData = Array.isArray(response.data) ? response.data : [];
        setActivities(activitiesData);
        if (activitiesData.length > 0) {
          setSelectedActivity(activitiesData[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
        setError("Não foi possível carregar a lista de atividades.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const handleFileSelection = (fileList) => {
    if (fileList) {
      setFiles(Array.from(fileList));
    } else {
      setFiles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // =====================================================================
    // CORREÇÃO 1: Adicionar validação para o objeto 'user'.
    // Se 'user' não existir ou não tiver um ID, a função para e avisa o erro.
    // =====================================================================
    if (!user || !user.id || !user.ong_id) {
      setError("Erro: Informações do usuário não encontradas. Por favor, faça login novamente.");
      console.error("A prop 'user' está ausente ou incompleta.", user);
      return; // Para a execução aqui.
    }

    if (files.length === 0) {
      setError("Selecione ao menos um arquivo.");
      return;
    }

    setIsLoading(true); // Inicia o carregamento aqui, antes da requisição.
    const formData = new FormData();
    formData.append('description', description);
    formData.append('userId', user.id);
    formData.append('ongId', user.ong_id);
    formData.append('activity_id', selectedActivity);

    files.forEach(file => {
      formData.append('proof_files', file);
    });

    try {
      await api.post('/proofs', formData);
      alert('Prova social enviada para análise com sucesso!');
      setDescription('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Ocorreu um erro ao enviar a sua prova.";
      setError(errorMessage);
      console.error("Erro ao enviar prova:", err);
    } finally {
      setIsLoading(false); // Finaliza o carregamento em qualquer cenário.
    }
  };

  // =====================================================================
  // CORREÇÃO 2: A condição 'disabled' do botão agora também verifica se 'user' existe.
  // Isso desativa visualmente o botão se a página não tiver os dados necessários.
  // =====================================================================
  const isButtonDisabled = isLoading || !user;

  return (
    <ContentWrapper title="Enviar Prova Social">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {/* Mensagem de erro aprimorada */}
        {error && <p className={styles.error}>{error}</p>}
        {!user && !isLoading && <p className={styles.error}>Não é possível enviar provas. Dados do usuário não carregados.</p>}

        <SelectField 
          label="Tipo de Atividade" 
          name="activity" 
          value={selectedActivity} 
          onChange={(e) => setSelectedActivity(e.target.value)}
          disabled={isButtonDisabled}
        >
          {isLoading ? (
            <option>A carregar atividades...</option>
          ) : (
            Array.isArray(activities) && activities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.description} ({activity.seal_value} selos)
              </option>
            ))
          )}
        </SelectField>

        <TextareaField 
          label="Descreva a atividade (opcional)" 
          name="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          disabled={isButtonDisabled}
        />

        <FileUpload 
          label="Comprovante (até 5 fotos)" 
          onFileSelect={handleFileSelection}
          ref={fileInputRef}
          multiple
          disabled={isButtonDisabled}
        />

        <div className={styles.submitButtonContainer}>
          <Button type="submit" disabled={isButtonDisabled}>
            {isLoading ? 'Enviando...' : 'Enviar para Análise'}
          </Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default SendSocialProofPage;
