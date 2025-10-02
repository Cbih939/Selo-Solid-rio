// src/pages/citizen/SendSocialProofPage/SendSocialProofPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import api from '../../../api/api';
import styles from './SendSocialProofPage.module.css';

const SendSocialProofPage = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (err) {
        console.error("Erro ao buscar atividades:", err);
        setError("Não foi possível carregar a lista de atividades.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // ++ LÓGICA CORRETA: Recebe um array de arquivos e o armazena. ++
  const handleFileSelection = (acceptedFiles) => {
    setFiles(acceptedFiles || []);
    if (error === "Selecione ao menos um arquivo.") {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user || !user.id || !user.ong_id) {
      setError("Erro: Informações do usuário não encontradas. Por favor, faça login novamente.");
      return;
    }

    if (files.length === 0) {
      setError("Selecione ao menos um arquivo.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();

    formData.append('description', description);
    formData.append('userId', user.id);
    formData.append('ongId', user.ong_id);
    formData.append('activity_id', selectedActivity);

    // ++ LÓGICA CORRETA: Adiciona cada arquivo com o mesmo nome de campo. ++
    files.forEach(file => {
      formData.append('proof_files', file);
    });

    try {
      await api.post('/proofs', formData);
      setSuccess('Prova social enviada para análise com sucesso!');
      setDescription('');
      setFiles([]);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Ocorreu um erro ao enviar a sua prova.";
      setError(errorMessage);
      console.error("Erro ao enviar prova:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !user;

  return (
    <ContentWrapper title="Enviar Prova Social">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        {!user && !isLoading && <p className={styles.error}>Não é possível enviar provas. Dados do usuário não carregados.</p>}

        <SelectField 
          label="Tipo de Atividade" 
          name="activity" 
          value={selectedActivity} 
          onChange={(e) => setSelectedActivity(e.target.value)}
          disabled={isDisabled}
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
          disabled={isDisabled}
        />

        <FileUpload 
          label="Comprovante (até 5 fotos)" 
          onFileSelect={handleFileSelection}
          multiple={true}
          accept="image/*"
          maxFiles={5}
          disabled={isDisabled}
        />

        <div className={styles.submitButtonContainer}>
          <Button type="submit" disabled={isDisabled}>
            {isLoading ? 'Enviando...' : 'Enviar para Análise'}
          </Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default SendSocialProofPage;
