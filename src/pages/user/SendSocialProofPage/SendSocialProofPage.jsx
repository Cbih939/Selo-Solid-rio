import React, { useState, useEffect, useRef } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import api from '../../../api/api';
import styles from './SendSocialProofPage.module.css'; // Supondo que você tenha um CSS module

const SendSocialProofPage = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]); // Array de arquivos
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

  // =====================================================================
  // CORREÇÃO 1: Criar uma função para lidar com a seleção de arquivos.
  // Esta função converte o FileList (que não é um array) em um array de verdade.
  // =====================================================================
  const handleFileSelection = (fileList) => {
    if (fileList) {
      setFiles(Array.from(fileList)); // Converte o FileList para um Array
    } else {
      setFiles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (files.length === 0) {
      setError("Selecione ao menos um arquivo.");
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('userId', user.id);
    formData.append('ongId', user.ong_id);
    formData.append('activity_id', selectedActivity);

    // =====================================================================
    // CORREÇÃO 2: Agora 'files' é garantidamente um array.
    // O .forEach() vai funcionar sem erros.
    // O nome do campo 'proof_files' deve corresponder ao que o backend espera
    // no middleware Multer (ex: upload.array('proof_files', 5))
    // =====================================================================
    files.forEach(file => {
      formData.append('proof_files', file);
    });

    try {
      await api.post('/proofs', formData);
      alert('Prova social enviada para análise com sucesso!');

      // Resetar campos
      setDescription('');
      setFiles([]);
      if (fileInputRef.current) {
        // A forma correta de resetar um input de arquivo é resetando o formulário
        // ou, de forma mais simples, limpando seu valor.
        fileInputRef.current.value = null;
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Ocorreu um erro ao enviar a sua prova.";
      setError(errorMessage);
      console.error("Erro ao enviar prova:", err);
    }
  };

  return (
    <ContentWrapper title="Enviar Prova Social">
      {/* Usando um estilo unificado para o formulário */}
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {error && <p className={styles.error}>{error}</p>}

        <SelectField 
          label="Tipo de Atividade" 
          name="activity" 
          value={selectedActivity} 
          onChange={(e) => setSelectedActivity(e.target.value)}
          disabled={isLoading}
        >
          {isLoading ? (
            <option>A carregar atividades...</option>
          ) : (
            // Proteção adicional para o map
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
        />

        <FileUpload 
          label="Comprovante (até 5 fotos)" 
          onFileSelect={handleFileSelection} // Usa a nova função de conversão
          ref={fileInputRef}
          multiple // Garante que o input aceite múltiplos arquivos
        />

        <div className={styles.submitButtonContainer}>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Aguarde...' : 'Enviar para Análise'}
          </Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default SendSocialProofPage;
