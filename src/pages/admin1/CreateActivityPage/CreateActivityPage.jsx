// Arquivo: src/pages/admin5/CreateActivityPage/CreateActivityPage.jsx

import React, { useState, useEffect } from 'react';
import styles from './CreateActivityPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateActivityPage = ({ user, currentUser }) => {
  // Puxa o usuário de todas as formas possíveis para não haver falhas
  const loggedUser = user || currentUser || JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // VERIFICAÇÃO DE SEGURANÇA: Só é admin se a role for explicitamente admin1 ou admin5
  const userRole = String(loggedUser?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin5' || userRole === 'admin1';
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [ongs, setOngs] = useState([]);
  // Se não for Admin, tranca o ID no ID da ONG do utilizador logado
  const [selectedOngId, setSelectedOngId] = useState(isAdmin ? '' : loggedUser?.ong_id);

  const [formData, setFormData] = useState({
    description: '',
    seal_value: '',
    is_automatic: 0,
    validation_method: 'Envio de Foto'
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      api.get('/ongs')
        .then(res => setOngs(res.data))
        .catch(err => console.error("Erro ao carregar OSCs:", err));
    }
  }, [isAdmin]);

  // Força a atualização do ID da OSC caso o localStorage demore a responder
  useEffect(() => {
    if (!isAdmin && loggedUser?.ong_id) {
        setSelectedOngId(loggedUser.ong_id);
    }
  }, [isAdmin, loggedUser]);

  useEffect(() => {
    if (selectedOngId) {
      fetchActivities(selectedOngId);
    } else {
      setActivities([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOngId]);

  const fetchActivities = async (ongId) => {
    try {
      setLoading(true);
      const response = await api.get(`/proofs/activities/ong/${ongId}`);
      setActivities(response.data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOngId) return alert("Por favor, selecione uma organização.");
    
    setIsSubmitting(true);
    const data = new FormData();
    data.append('description', formData.description);
    data.append('seal_value', formData.seal_value);
    data.append('is_automatic', formData.is_automatic);
    data.append('validation_method', formData.validation_method);
    data.append('ong_id', selectedOngId); 
    
    if (imageFile) data.append('activity_image', imageFile);

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
      setIsSubmitting(false);
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
    if (!window.confirm("Tem certeza que deseja excluir esta atividade? Beneficiários não poderão mais enviar provas para ela.")) return;
    try {
      await api.delete(`/proofs/activities/${id}`);
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

  const filteredActivities = activities.filter(activity => activity.description.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <ContentWrapper title="Catálogo de Atividades">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Gestão de Atividades (Provas Sociais)</h2>
        <p className={styles.introText}>
          Crie ou edite as atividades que os beneficiários poderão selecionar para enviar comprovativos e ganhar selos na plataforma.
        </p>
      </div>

      <div className={styles.container}>
        
        {/* BLOCO DE SELEÇÃO: SÓ APARECE PARA ADMINS VERDADEIROS */}
        {isAdmin && (
          <div className={styles.adminSelectorBox}>
            <label className={styles.adminSelectorLabel}>
              🌐 Gerenciar Catálogo da Instituição (OSC):
            </label>
            <select className={styles.adminSelect} value={selectedOngId} onChange={(e) => setSelectedOngId(e.target.value)}>
              <option value="">Selecione uma organização para começar...</option>
              {ongs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
            </select>
          </div>
        )}

        {/* MENSAGEM DE ERRO SE A ONG ESTIVER BUGADA */}
        {!isAdmin && !loggedUser?.ong_id && (
           <div className={styles.errorAlert}>
             ⚠️ Erro Crítico: A sua conta não está vinculada a nenhuma OSC. Contacte o administrador.
           </div>
        )}

        {selectedOngId ? (
          <>
            {/* ======================================= */}
            {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
            {/* ======================================= */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>
                {editingId ? '✏️ Editar Atividade Existente' : '✨ Criar Nova Atividade'}
              </h3>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                
                <div className={styles.grid2}>
                  <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                    <label>Nome / Título da Atividade *</label>
                    <input 
                      type="text" 
                      className={styles.inputField}
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Ex: Reunião de Pais, Presença na Oficina, etc."
                      required 
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>Recompensa (Qtd. de Selos) *</label>
                    <input 
                      type="number" 
                      className={styles.inputField}
                      value={formData.seal_value} 
                      onChange={(e) => setFormData({ ...formData, seal_value: e.target.value })} 
                      placeholder="Ex: 5"
                      min="1"
                      required 
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Tipo de Validação / Aprovação</label>
                    <select 
                      className={styles.inputField} 
                      value={formData.is_automatic} 
                      onChange={(e) => setFormData({ ...formData, is_automatic: parseInt(e.target.value) })}
                    >
                      <option value={0}>📷 Manual (OSC precisa aprovar a foto)</option>
                      <option value={1}>⚡ Automática (Aprovação Instantânea)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Imagem de Capa (Opcional)</label>
                  <input 
                    type="file" 
                    className={styles.fileInput}
                    onChange={(e) => setImageFile(e.target.files[0])} 
                    accept="image/*" 
                  />
                  <small className={styles.helperText}>Uma imagem ilustrativa para ajudar o beneficiário a identificar a atividade.</small>
                </div>

                <div className={styles.formActions}>
                  {editingId && <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>Cancelar Edição</Button>}
                  <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} disabled={isSubmitting}>
                    {isSubmitting ? 'A Processar...' : editingId ? 'Salvar Alterações' : 'Cadastrar Atividade'}
                  </Button>
                </div>
              </form>
            </div>

            {/* ======================================= */}
            {/* LISTAGEM DE ATIVIDADES (CATÁLOGO) */}
            {/* ======================================= */}
            <div className={styles.catalogSection}>
              <div className={styles.catalogHeader}>
                <h3 className={styles.sectionTitle} style={{ margin: 0, border: 'none' }}>Catálogo Atual</h3>
                {activities.length > 0 && (
                  <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input 
                      type="text" 
                      placeholder="Procurar atividade..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className={styles.searchInput} 
                    />
                  </div>
                )}
              </div>

              {loading ? (
                <div className={styles.emptyState}><p>A carregar atividades...</p></div>
              ) : filteredActivities.length > 0 ? (
                <div className={styles.activityGrid}>
                  {filteredActivities.map(activity => (
                    <div key={activity.id} className={styles.activityCard}>
                      <div className={styles.cardHeader}>
                        <h4 className={styles.activityTitle}>{activity.description}</h4>
                        <span className={styles.sealBadge}>+{activity.seal_value} Selos</span>
                      </div>
                      
                      <div className={styles.cardBody}>
                        {activity.is_automatic ? (
                          <span className={styles.badgeAuto}>⚡ Aprovação Automática</span>
                        ) : (
                          <span className={styles.badgeManual}>📷 Avaliação Manual da OSC</span>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <button type="button" onClick={() => handleEdit(activity)} className={styles.editBtn}>✏️ Editar</button>
                        <button type="button" onClick={() => handleDelete(activity.id)} className={styles.deleteBtn}>🗑️ Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>{activities.length === 0 ? "O catálogo desta OSC está vazio. Crie a primeira atividade acima!" : "Nenhuma atividade corresponde à pesquisa."}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          isAdmin && (
            <div className={styles.emptyState}>
              <p style={{ fontSize: '1.1rem', color: '#64748b' }}>⬆️ Selecione uma organização acima para visualizar e gerir o seu catálogo de atividades.</p>
            </div>
          )
        )}
      </div>
    </ContentWrapper>
  );
};

export default CreateActivityPage;