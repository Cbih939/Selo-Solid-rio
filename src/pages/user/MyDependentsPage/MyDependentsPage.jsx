import React, { useState, useEffect } from 'react';
import api from '../../../api/api';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import styles from './MyDependentsPage.module.css';

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const MyDependentsPage = () => {
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // O estado do formulário agora acompanha a nova base de dados
  const [formData, setFormData] = useState({
    name: '', 
    kinship: '', 
    birth_date: '', 
    cpf: '', 
    profile_photo: ''
  });

  const fetchDependents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users/me/dependents');
      setDependents(response.data);
    } catch (err) {
      console.error("Erro ao buscar dependentes:", err);
      setError('Não foi possível carregar a sua lista de dependentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependents();
  }, []);

  const handleOpenModal = (dependent = null) => {
    if (dependent) {
      setEditingId(dependent.id);
      setFormData({
        name: dependent.name || dependent.full_name || '', // Fallback para o antigo full_name se existir
        kinship: dependent.kinship || dependent.relationship || '',
        birth_date: dependent.birth_date ? dependent.birth_date.split('T')[0] : '',
        cpf: dependent.cpf || '',
        profile_photo: dependent.profile_photo || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', kinship: '', birth_date: '', cpf: '', profile_photo: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setFormData(prev => ({ ...prev, profile_photo: base64 }));
    }
  };

  const handleSaveDependent = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const isNew = !editingId;
    const url = isNew ? '/users/me/dependents' : `/users/me/dependents/${editingId}`;
    const method = isNew ? 'post' : 'put';

    const payload = {
      ...formData,
      cpf: formData.cpf?.trim() === '' ? null : formData.cpf
    };

    try {
      await api[method](url, payload);
      handleCloseModal();
      await fetchDependents();
      alert(`Dependente ${isNew ? 'adicionado' : 'atualizado'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao salvar dependente:", err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Ocorreu um erro ao salvar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependent = async (dependentId) => {
    if (window.confirm('Tem a certeza de que deseja excluir este dependente?')) {
      try {
        await api.delete(`/users/me/dependents/${dependentId}`);
        await fetchDependents();
      } catch (err) {
        console.error("Erro ao excluir dependente:", err);
        alert('Ocorreu um erro ao excluir o dependente.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  if (loading) return <ContentWrapper title="Meus Dependentes"><div className={styles.loadingContainer}><p className={styles.loadingText}>A carregar a sua família...</p></div></ContentWrapper>;
  if (error) return <ContentWrapper title="Meus Dependentes"><div className={styles.errorContainer}><p className={styles.errorText}>{error}</p></div></ContentWrapper>;

  return (
    <ContentWrapper title="Meus Dependentes">
      <div className={styles.container}>
        
        <div className={styles.headerBox}>
          <div className={styles.headerText}>
            <h3>Gestão Familiar</h3>
            <p>Adicione até 20 dependentes para os vincular às suas provas sociais.</p>
          </div>
          <button 
            className={styles.addBtn} 
            onClick={() => handleOpenModal()} 
            disabled={dependents.length >= 20}
          >
            + Adicionar Dependente
          </button>
        </div>

        {dependents.length > 0 ? (
          <div className={styles.grid}>
            {dependents.map(dep => (
              <div key={dep.id} className={styles.dependentCard}>
                
                <div className={styles.cardHeader}>
                  <div className={styles.avatarBox}>
                    {dep.profile_photo ? (
                      <img src={dep.profile_photo} alt={dep.name} className={styles.avatarImg} />
                    ) : (
                      <span className={styles.avatarInitials}>{(dep.name || dep.full_name || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => handleOpenModal(dep)} title="Editar">✏️</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteDependent(dep.id)} title="Excluir">🗑️</button>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h4 className={styles.depName}>{dep.name || dep.full_name}</h4>
                  <span className={styles.depKinship}>{dep.kinship || dep.relationship || 'Não informado'}</span>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>Nascimento</span>
                    <span className={styles.infoValue}>{formatDate(dep.birth_date)}</span>
                  </div>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>CPF</span>
                    <span className={styles.infoValue}>{dep.cpf || 'Não informado'}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👨‍👩‍👧‍👦</div>
            <h3>Nenhum dependente registado</h3>
            <p>Clique no botão acima para adicionar membros da sua família ao seu perfil.</p>
          </div>
        )}

      </div>

      {/* MODAL DE ADIÇÃO / EDIÇÃO */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingId ? "Editar Dependente" : "Adicionar Dependente"}
      >
        <form className={styles.modalForm} onSubmit={handleSaveDependent}>
          
          <div className={styles.photoUploadSection}>
            <div className={styles.avatarPreviewLg}>
              {formData.profile_photo ? (
                <img src={formData.profile_photo} alt="Avatar" className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarPlaceholderLg}>📷</span>
              )}
            </div>
            <label className={styles.uploadLabelBtn}>
              Escolher Foto (Opcional)
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className={styles.hiddenInput} />
            </label>
          </div>

          <div className={styles.inputGroup}>
            <label>Nome Completo *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="Ex: Maria da Silva"
            />
          </div>

          <div className={styles.rowGrid}>
            <div className={styles.inputGroup}>
              <label>Parentesco *</label>
              <input 
                type="text" 
                name="kinship" 
                value={formData.kinship} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Filho(a)"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Data de Nascimento *</label>
              <input 
                type="date" 
                name="birth_date" 
                value={formData.birth_date} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>CPF (Opcional)</label>
            <input 
              type="text" 
              name="cpf" 
              value={formData.cpf} 
              onChange={handleChange} 
              placeholder="Apenas números"
            />
          </div>

          <div className={styles.modalActionsRow}>
            <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'A guardar...' : 'Salvar Dependente'}
            </button>
          </div>
        </form>
      </Modal>

    </ContentWrapper>
  );
};

export default MyDependentsPage;