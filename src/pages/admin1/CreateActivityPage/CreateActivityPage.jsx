import React, { useState, useEffect } from 'react';
import styles from './CreateActivityPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateActivityPage = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('');
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    seal_value: '',
    is_automatic: 0,
    validation_method: 'Envio de Foto'
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/proofs/ongs-list');
        setOngs(response.data);
        
        const defaultOng = currentUser?.ong_id || currentUser?.id;
        if (defaultOng) setSelectedOng(defaultOng);
      } catch (error) {
        console.error("Erro ao carregar OSCs:", error);
      }
    };
    fetchOngs();
  }, [currentUser]);

  useEffect(() => {
    if (selectedOng) {
      fetchActivities();
      setSearchTerm('');
    } else {
      setActivities([]);
    }
  }, [selectedOng]);

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/proofs/activities/ong/${selectedOng}`);
      setActivities(response.data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOng) return alert("Por favor, selecione uma OSC primeiro.");
    
    setLoading(true);

    const data = new FormData();
    data.append('description', formData.description);
    data.append('seal_value', formData.seal_value);
    data.append('is_automatic', formData.is_automatic);
    data.append('validation_method', formData.validation_method);
    data.append('ong_id', selectedOng);
    
    if (imageFile) {
      data.append('activity_image', imageFile);
    }

    try {
      if (editingId) {
        await api.put(`/proofs/activities/${editingId}`, data);
        alert('Atividade atualizada com sucesso!');
      } else {
        await api.post('/proofs/activities', data);
        alert('Atividade cadastrada com sucesso!');
      }
      
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error(error);
      alert('Erro ao processar requisição.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingId(activity.id);
    setFormData({
      description: activity.description,
      seal_value: activity.seal_value,
      is_automatic: activity.is_automatic,
      validation_method: activity.validation_method
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta atividade?")) return;
    
    try {
      await api.delete(`/proofs/activities/${id}`);
      alert("Atividade removida!");
      fetchActivities();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao excluir.");
    }
  };

  const resetForm = () => {
    setFormData({ description: '', seal_value: '', is_automatic: 0, validation_method: 'Envio de Foto' });
    setImageFile(null);
    setEditingId(null);
  };

  const filteredActivities = activities.filter(activity => 
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ContentWrapper title="Gerenciador de Atividades Sociais">
      <div className={styles.container}>
        
        <div className={styles.section}>
          <label className={styles.label}>Gerenciar Atividades da OSC:</label>
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

        <hr className={styles.divider} />

        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.subtitle}>{editingId ? 'Editar Atividade' : 'Nova Atividade'}</h3>
          
          <InputField
            label="Nome da Atividade"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <InputField
            label="Quantidade de Selos"
            type="number"
            value={formData.seal_value}
            onChange={(e) => setFormData({ ...formData, seal_value: e.target.value })}
            required
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Tipo de Validação</label>
            <select
              className={styles.select}
              value={formData.is_automatic}
              onChange={(e) => setFormData({ ...formData, is_automatic: parseInt(e.target.value) })}
            >
              <option value={0}>Validada por você (OSC)</option>
              <option value={1}>Automática (Aprovação Instantânea)</option>
            </select>
          </div>

          <InputField
            label="Imagem de Exemplo"
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
            accept="image/*"
          />

          <div className={styles.buttonGroup}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Atividade'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        <hr className={styles.divider} />

        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h3 className={styles.subtitle}>Atividades Cadastradas</h3>
            
            {activities.length > 0 && (
              <div className={styles.searchContainer}>
                <input 
                  type="text" 
                  placeholder="Pesquisar atividade..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            )}
          </div>

          <div className={styles.grid}>
            {filteredActivities.length > 0 ? filteredActivities.map(activity => (
              <div key={activity.id} className={styles.activityCard}>
                <div className={styles.cardInfo}>
                  <strong>{activity.description}</strong>
                  <span>{activity.seal_value} Selos | {activity.is_automatic ? 'Automática' : 'Manual'}</span>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" onClick={() => handleEdit(activity)} className={styles.editBtn}>Editar</button>
                  <button type="button" onClick={() => handleDelete(activity.id)} className={styles.deleteBtn}>Excluir</button>
                </div>
              </div>
            )) : (
              <p className={styles.emptyMessage}>
                {activities.length === 0 
                  ? "Nenhuma atividade encontrada para esta OSC." 
                  : "Nenhuma atividade corresponde à sua pesquisa."}
              </p>
            )}
          </div>
        </div>

      </div>
    </ContentWrapper>
  );
};

export default CreateActivityPage;