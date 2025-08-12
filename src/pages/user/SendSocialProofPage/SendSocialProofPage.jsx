import React, { useState, useEffect } from 'react';
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
  const [file, setFile] = useState(null); // Estado para guardar o ficheiro
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

    // CORREÇÃO: Usa FormData para enviar o formulário com o ficheiro.
    const formData = new FormData();
    formData.append('description', description);
    formData.append('userId', user.id);
    formData.append('ongId', user.ong_id);
    formData.append('activity_id', selectedActivity);
    
    // 'proof_file' deve ser o mesmo nome usado no middleware do backend (upload.single('proof_file'))
    if (file) {
      formData.append('proof_file', file);
    }

    try {
      // O Axios deteta automaticamente o FormData e define o Content-Type correto.
      await api.post('/proofs', formData);
      alert('Prova social enviada para análise com sucesso!');
      setDescription('');
      setFile(null);
      // Idealmente, o componente FileUpload deveria ter uma função para limpar o nome do ficheiro.
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
        {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}

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

        <TextareaField label="Descreva a atividade (opcional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        
        {/* O componente FileUpload agora guarda o ficheiro no estado 'file' */}
        <FileUpload label="Comprovante" onFileSelect={setFile} />

        <div style={{maxWidth: '300px', marginTop: '2rem'}}>
            <Button type="submit">Enviar para Análise</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default SendSocialProofPage;