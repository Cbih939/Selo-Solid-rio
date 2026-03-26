import React, { useState, useEffect } from 'react';
import styles from './CreateActivityPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateActivityPage = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- LÓGICA DE PERMISSÕES ---
  // Verifica se o utilizador é um Administrador (pode ver todas as OSCs)
  const isAdmin = currentUser?.role === 'admin5' || currentUser?.role === 'admin1';
  
  // Estado para guardar a lista de ONGs (só preenchido se for Admin)
  const [ongs, setOngs] = useState([]);
  
  // Se for Admin, começa vazio para ele escolher. Se for OSC, bloqueia logo no ID da própria OSC.
  const [selectedOngId, setSelectedOngId] = useState(isAdmin ? '' : currentUser?.ong_id);

  const [formData, setFormData] = useState({
    description: '',
    seal_value: '',
    is_automatic: 0,
    validation_method: 'Envio de Foto'
  });
  const [imageFile, setImageFile] = useState(null);

  // 1. Carrega a lista de OSCs apenas se o utilizador for Administrador
  useEffect(() => {
    if (isAdmin) {
      api.get('/ongs')
        .then(res => setOngs(res.data))
        .catch(err => console.error("Erro ao carregar OSCs:", err));
    }
  }, [isAdmin]);

  // 2. Carrega as atividades sempre que o ID da organização selecionada mudar
  useEffect(() => {
    if (selectedOngId) {
      fetchActivities(selectedOngId);
    } else {
      setActivities([]); // Limpa a lista se o admin ainda não tiver escolhido uma OSC
    }
  }, [selectedOngId]);

  const fetchActivities = async (ongId) => {
    try {
      const response = await api.get(`/proofs/activities/ong/${ongId}`);
      setActivities(response.data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOngId) return alert("Por favor, selecione uma organização primeiro.");
    
    setLoading(true);

    const data = new FormData();
    data.append('description', formData.description);
    data.append('seal_value', formData.seal_value);
    data.append('is_automatic', formData.is_automatic);
    data.append('validation_method', formData.validation_method);
    data.append('ong_id', selectedOngId); // Vai sempre com o ID correto e seguro
    
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
      fetchActivities(selectedOngId);
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
      fetchActivities(selectedOngId);
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
    <ContentWrapper title="Catálogo de Atividades">
      <div className={styles.container}>
        
        {/* BLOCO DE SELEÇÃO: SÓ APARECE PARA ADMINS */}
        {isAdmin && (
          <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>
              Gerenciar Atividades da OSC:
            </label>
            <select 
              value={selectedOngId} 
              onChange={(e) => setSelectedOngId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            >
              <option value="">Selecione uma organização...</option>
              {ongs.map(ong => (
                <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Formulário: Só aparece se uma OSC estiver selecionada (para a OSC já está sempre selecionada) */}
        {selectedOngId ? (
          <>
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
                <h3 className={styles.subtitle}>O Catálogo de Atividades</h3>
                
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
                      ? "Nenhuma atividade cadastrada neste catálogo." 
                      : "Nenhuma atividade corresponde à sua pesquisa."}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
            <p>Selecione uma organização acima para começar a gerir o seu catálogo de atividades.</p>
          </div>
        )}

      </div>
    </ContentWrapper>
  );
};

export default CreateActivityPage;