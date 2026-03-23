import React, { useState } from 'react';
import styles from './CreateActivityPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateActivityPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    seal_value: '',
    is_automatic: 0,
    validation_method: 'Envio de Foto'
  });
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('description', formData.description);
    data.append('seal_value', formData.seal_value);
    data.append('is_automatic', formData.is_automatic);
    data.append('validation_method', formData.validation_method);
    if (imageFile) {
      data.append('activity_image', imageFile);
    }

    try {
      await api.post('/proofs/activities', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Atividade Social cadastrada com sucesso!');
      // Limpar formulário
      setFormData({ description: '', seal_value: '', is_automatic: 0, validation_method: 'Envio de Foto' });
      setImageFile(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao cadastrar atividade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper title="Gerenciador de Atividades Sociais">
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            label="Nome da Atividade (Ex: Doação de Sangue)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <InputField
            label="Quantidade de Selos por conclusão"
            type="number"
            value={formData.seal_value}
            onChange={(e) => setFormData({ ...formData, seal_value: e.target.value })}
            required
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>Tipo de Validação</label>
            <select
              className={styles.select}
              value={formData.is_automatic}
              onChange={(e) => setFormData({ ...formData, is_automatic: parseInt(e.target.value) })}
            >
              <option value={0}>Validada por Administrador (OSC)</option>
              <option value={1}>Automática (Aprovação Instantânea)</option>
            </select>
          </div>

          <InputField
            label="Imagem de Ajuda/Exemplo (Para orientar o beneficiário)"
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
            accept="image/*"
          />

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Salvar Atividade Social'}
          </Button>
        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateActivityPage;