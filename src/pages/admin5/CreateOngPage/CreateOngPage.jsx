// src/pages/admin/CreateOngPage/CreateOngPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FormSection from '../../../components/ui/FormSection/FormSection';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import styles from './CreateOngPage.module.css';
import api from '../../../api/api';
import axios from 'axios';

const CreateOngPage = () => {
  const initialFormData = {
    fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '',
    contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
    address: '', address_number: '', district: '', city: '', state: '', country: 'Brasil',
    president_name: '', president_cpf: '',
    coordinator_name: '', coordinator_cpf: '', coordinator_email: '', coordinator_phone: '', coordinator_password: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
    setFormData(prev => ({ ...prev, zip_code: value }));
  };

  const handleFileSelect = (selected, type) => {
    const file = Array.isArray(selected) ? selected[0] : selected;
    if (type === 'logo') setLogoFile(file);
    if (type === 'ata') setAtaFile(file);
    if (type === 'statute') setStatuteFile(file);
  };

  const fetchAddressFromCEP = useCallback(async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    setIsFetchingCep(true);
    setErrors(prev => ({ ...prev, zip_code: null }));
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/` );
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          district: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      } else {
        setErrors(prev => ({ ...prev, zip_code: 'CEP não encontrado.' }));
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
      setErrors(prev => ({ ...prev, zip_code: 'Erro ao buscar CEP.' }));
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  useEffect(() => {
    const cleanCep = formData.zip_code.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressFromCEP(formData.zip_code);
    }
  }, [formData.zip_code, fetchAddressFromCEP]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setIsSubmitting(true);

    const dataToSubmit = new FormData();

    // Adiciona campos da ONG (filtramos os campos do coordenador para mapear manualmente abaixo)
    for (const key in formData) {
      if (!key.startsWith('coordinator_')) {
        dataToSubmit.append(key, formData[key]);
      }
    }
    
    // CORREÇÃO: Mapeando campos do coordenador para o que o backend espera (responsible_*)
    dataToSubmit.append('responsible_name', formData.coordinator_name);
    dataToSubmit.append('responsible_cpf', formData.coordinator_cpf);
    dataToSubmit.append('responsible_email', formData.coordinator_email);
    dataToSubmit.append('responsible_phone', formData.coordinator_phone);
    dataToSubmit.append('responsible_password', formData.coordinator_password);

    // Adiciona os arquivos
    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.post('/ongs', dataToSubmit);
      
      setSuccessMessage(`OSC "${formData.fantasy_name}" criada com sucesso!`);
      setFormData(initialFormData);
      setLogoFile(null);
      setAtaFile(null);
      setStatuteFile(null);
      
    } catch (err) {
      const errorData = err.response?.data;
      console.error("Erro ao criar OSC:", errorData || err.message);
      
      if (errorData && typeof errorData.error === 'string') {
        setErrors({ submit: errorData.error });
      } else {
        setErrors({ submit: 'Não foi possível criar a OSC. Verifique os dados e tente novamente.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isFetchingCep || isSubmitting;
  const buttonText = isFetchingCep ? 'Buscando CEP...' : (isSubmitting ? 'Enviando...' : 'Finalizar Cadastro da OSC');

  return (
    <ContentWrapper title="Cadastro de Nova OSC">
      <p className={styles.subtitle}>Preencha os dados abaixo para registrar uma nova Organização da Sociedade Civil.</p>
      
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      
      <form onSubmit={handleSubmit}>
        <FormSection number="1" title="Informações da OSC">
          <InputField label="Nome Fantasia da OSC" name="fantasy_name" value={formData.fantasy_name} onChange={handleChange} required />
          <InputField label="Razão Social" name="corporate_name" value={formData.corporate_name} onChange={handleChange} required />
          <InputField label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleChange} error={errors.cnpj} mask="cnpj" required />
          <InputField label="Data de Fundação" name="foundation_date" type="date" value={formData.foundation_date} onChange={handleChange} />
        </FormSection>

        <FormSection number="2" title="Documentos">
          <FileUpload label="Logotipo" onFileSelect={(file) => handleFileSelect(file, 'logo')} accept="image/*" />
          <FileUpload label="Última ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" />
          <FileUpload label="Estatuto Social (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" />
        </FormSection>

        <FormSection number="3" title="Contato e Endereço">
          <InputField label="E-mail de Contato" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} required />
          <InputField label="Telefone / WhatsApp" name="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} mask="phone" />
          <InputField label="Website" name="website" type="url" placeholder="https://..." value={formData.website} onChange={handleChange} />
          <InputField label="Instagram" name="instagram" placeholder="@seu_perfil" value={formData.instagram} onChange={handleChange} />
          <InputField label="CEP" name="zip_code" placeholder="xxxxx-xxx" value={formData.zip_code} onChange={handleCepChange} error={errors.zip_code} disabled={isLoading} required />
          <InputField label="Endereço" name="address" value={formData.address} onChange={handleChange} required />
          <InputField label="Número" name="address_number" value={formData.address_number} onChange={handleChange} required />
          <InputField label="Bairro" name="district" value={formData.district} onChange={handleChange} required />
          <InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} required />
          <InputField label="Estado" name="state" value={formData.state} onChange={handleChange} required />
          <InputField label="País" name="country" value={formData.country} onChange={handleChange} />
        </FormSection>

        <FormSection number="4" title="Responsável Legal (Presidente )">
          <InputField label="Nome" name="president_name" value={formData.president_name} onChange={handleChange} required />
          <InputField label="CPF" name="president_cpf" placeholder="000.000.000-00" value={formData.president_cpf} onChange={handleChange} error={errors.president_cpf} mask="cpf" required />
        </FormSection>

        <FormSection number="5" title="Coordenador do Programa Selo Cidadania">
          <InputField label="Nome Completo do Coordenador" name="coordinator_name" value={formData.coordinator_name} onChange={handleChange} required />
          <InputField label="CPF do Coordenador" name="coordinator_cpf" placeholder="000.000.000-00" value={formData.coordinator_cpf} onChange={handleChange} error={errors.coordinator_cpf} mask="cpf" required />
          <InputField label="E-mail do Coordenador (será o login)" name="coordinator_email" type="email" value={formData.coordinator_email} onChange={handleChange} error={errors.coordinator_email} required />
          <InputField label="Telefone do Coordenador" name="coordinator_phone" type="tel" value={formData.coordinator_phone} onChange={handleChange} mask="phone" />
          <InputField label="Senha Provisória para o Coordenador" name="coordinator_password" type="password" value={formData.coordinator_password} onChange={handleChange} required />
        </FormSection>

        {errors.submit && <p className={styles.error}>{errors.submit}</p>}

        <div className={styles.submitButton}>
          <Button type="submit" disabled={isLoading}>
            {buttonText}
          </Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateOngPage;