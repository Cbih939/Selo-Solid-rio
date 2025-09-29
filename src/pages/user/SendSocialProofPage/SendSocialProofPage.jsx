import React, { useState, useEffect, useRef } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import api from '../../../api/api';

const SendSocialProofPage = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]); // Array de arquivos
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(); // Para resetar o input de arquivos

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/proofs/activities');
        setActivities(response.data);
        if (response.data.length > 0) {
          setSelectedActivity(response.data[0].id);
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

    files.forEach(file => {
      formData.append('proof_files', file); // Append cada arquivo individualmente
    });

    try {
      await api.post('/proofs', formData);
      alert('Prova social enviada para análise com sucesso!');

      // Resetar campos
      setDescription('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Ocorreu um erro ao enviar a sua prova.");
      }
    }
  };

  return (
    <ContentWrapper title="Enviar Prova Social">
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <SelectField 
          label="Tipo de Atividade" 
          name="activity" 
          value={selectedActivity} 
          onChange={(e) => setSelectedActivity(e.target.value)}
        >
          {isLoading ? (
            <option>A carregar atividades...</option>
          ) : (
            activities.map(activity => (
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
          onFileSelect={setFiles} 
          ref={fileInputRef}
        />

        <div style={{ maxWidth: '300px', marginTop: '2rem' }}>
          <Button type="submit">Enviar para Análise</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default SendSocialProofPage;
