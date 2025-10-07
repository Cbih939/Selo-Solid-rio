// Arquivo: pages/ong/EditOngPage/EditOngPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import FormSection from '../../../components/ui/FormSection/FormSection';
import api from '../../../api/api';
import styles from './EditOngPage.module.css';

const EditOngPage = ({ user }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Estados para os novos ficheiros
  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);

  // Efeito para buscar os dados da ONG quando a página carrega
  useEffect(() => {
    if (!user || !user.ong_id) {
      setError("Informações do usuário não encontradas para carregar os dados da ONG.");
      setLoading(false);
      return;
    }

    const fetchOngData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/ongs/${user.ong_id}`);
        setFormData(response.data);
      } catch (err) {
        console.error("Erro ao buscar dados da ONG:", err);
        setError("Não foi possível carregar os dados da sua ONG.");
      } finally {
        setLoading(false);
      }
    };

    fetchOngData();
  }, [user]);

  // Manipulador para campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manipulador para ficheiros
  const handleFileChange = (file, type) => {
    if (type === 'logo') setLogoFile(file);
    if (type === 'ata') setAtaFile(file);
    if (type === 'statute') setStatuteFile(file);
  };

  // Manipulador para submeter o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    const dataToSubmit = new FormData();

    // Adiciona os campos de texto ao FormData
    Object.entries(formData).forEach(([key, value]) => {
      // Evita adicionar objetos ou valores nulos, exceto strings vazias
      if (value !== null && typeof value !== 'object') {
        dataToSubmit.append(key, value);
      }
    });

    // Adiciona os novos ficheiros se eles foram selecionados
    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.put(`/ongs/${user.ong_id}`, dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Informações da ONG atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar ONG:", err);
      alert("Ocorreu um erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <ContentWrapper title="Editar Minha ONG"><p>A carregar informações...</p></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Erro"><p>{error}</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Editar Minha ONG">
      {formData && (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <FormSection number="1" title="Informações Principais">
            <InputField label="Nome Fantasia" name="fantasy_name" value={formData.fantasy_name || ''} onChange={handleChange} required />
            <InputField label="Razão Social" name="corporate_name" value={formData.corporate_name || ''} onChange={handleChange} required />
            <InputField label="CNPJ" name="cnpj" value={formData.cnpj || ''} mask="cnpj" readOnly disabled />
            <InputField label="Data de Fundação" name="foundation_date" type="date" value={formData.foundation_date?.split('T')[0] || ''} onChange={handleChange} />
          </FormSection>

          <FormSection number="2" title="Contato e Endereço">
            <InputField label="E-mail de Contato" name="contact_email" type="email" value={formData.contact_email || ''} onChange={handleChange} required />
            <InputField label="Telefone" name="phone" type="tel" value={formData.phone || ''} mask="phone" onChange={handleChange} />
            <InputField label="Website" name="website" type="url" value={formData.website || ''} onChange={handleChange} />
            <InputField label="Instagram" name="instagram" value={formData.instagram || ''} onChange={handleChange} />
            <InputField label="Endereço" name="address" value={formData.address || ''} onChange={handleChange} />
             <InputField label="Cidade" name="city" value={formData.city || ''} onChange={handleChange} />
            <InputField label="Estado" name="state" value={formData.state || ''} onChange={handleChange} />
          </FormSection>

          <FormSection number="3" title="Documentos">
            {formData.logo_url && <p>Logotipo Atual: <a href={formData.logo_url} target="_blank" rel="noopener noreferrer">Ver Logotipo</a></p>}
            <FileUpload label="Alterar Logotipo (.png, .jpg)" onFileSelect={(file) => handleFileChange(file, 'logo')} accept="image/*" />
            
            {formData.ata_url && <p>Ata de Eleição Atual: <a href={formData.ata_url} target="_blank" rel="noopener noreferrer">Ver Ata</a></p>}
            <FileUpload label="Alterar ATA de Eleição (.pdf)" onFileSelect={(file) => handleFileChange(file, 'ata')} accept="application/pdf" />

            {formData.statute_url && <p>Estatuto Social Atual: <a href={formData.statute_url} target="_blank" rel="noopener noreferrer">Ver Estatuto</a></p>}
            <FileUpload label="Alterar Estatuto Social (.pdf)" onFileSelect={(file) => handleFileChange(file, 'statute')} accept="application/pdf" />
          </FormSection>
          
          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A salvar...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      )}
    </ContentWrapper>
  );
};

export default EditOngPage;