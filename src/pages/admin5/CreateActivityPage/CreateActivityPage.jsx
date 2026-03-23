// Arquivo: src/pages/admin5/CreateActivityPage/CreateActivityPage.jsx

import React, { useState } from 'react';
import styles from './CreateActivityPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateActivityPage = ({ currentUser }) => {
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

    // Identifica qual a OSC dona dessa atividade
    // Se for um admin da própria OSC, usamos o id dele. Se for o Super Admin criando para alguém, precisaria de um select (mas aqui focamos na OSC logada).
    const ongId = currentUser?.ong_id || currentUser?.id;

    const data = new FormData();
    data.append('description', formData.description);
    data.append('seal_value', formData.seal_value);
    data.append('is_automatic', formData.is_automatic);
    data.append('validation_method', formData.validation_method);
    data.append('ong_id', ongId); // ✅ Vínculo crucial com a OSC
    
    if (imageFile) {
      data.append('activity_image', imageFile);
    }

    try {
      await api.post('/proofs/activities', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Atividade Social cadastrada com sucesso para sua OSC!');
      
      // Resetar form
      setFormData({ description: '', seal_value: '', is_automatic: 0, validation_method: 'Envio de Foto' });
      setImageFile(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao cadastrar atividade. Verifique se a tabela no banco possui a coluna ong_id.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper title="Gerenciador de Atividades Sociais">
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            label="Nome da Atividade (Ex: Doação de Alimentos)"
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Tipo de Validação
            </label>
            <select
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              value={formData.is_automatic}
              onChange={(e) => setFormData({ ...formData, is_automatic: parseInt(e.target.value) })}
            >
              <option value={0}>Validada por você (OSC)</option>
              <option value={1}>Automática (Aprovação Instantânea)</option>
            </select>
          </div>

          <InputField
            label="Imagem de Exemplo (Ajuda o beneficiário)"
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
            accept="image/*"
          />

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Atividade'}
          </Button>
        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateActivityPage;