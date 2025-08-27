import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FormSection from '../../../components/ui/FormSection/FormSection';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import styles from './CreateOngPage.module.css';
import api from '../../../api/api';
import axios from 'axios'; // Importamos o axios para a chamada da API do CEP

const CreateOngPage = () => {
  const [formData, setFormData] = useState({
    fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '',
    contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
    address: '', address_number: '', district: '', city: '', state: '', country: 'Brasil',
    responsible_name: '', responsible_cpf: '', responsible_email: '', responsible_phone: '', responsible_password: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // Função genérica para a maioria dos campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Função específica para o CEP com a nova máscara
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    value = value.substring(0, 8); // Limita a 8 dígitos no total

    if (value.length > 5) {
      // Aplica a máscara xxxxx-xxx
      value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
    }
    
    setFormData(prevState => ({ ...prevState, zip_code: value }));
  };

  const handleFileSelect = (file, type) => {
    if (type === 'logo') setLogoFile(file);
    if (type === 'ata') setAtaFile(file);
    if (type === 'statute') setStatuteFile(file);
  };

  // Função para buscar o endereço a partir do CEP
  const fetchAddressFromCEP = useCallback(async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const { data } = response;
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          district: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      } else {
        alert('CEP não encontrado.');
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert('Não foi possível buscar o endereço do CEP.');
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  // Hook para observar mudanças no campo do CEP
  useEffect(() => {
    const cleanCep = formData.zip_code.replace(/\D/g, '');
    if (cleanCep.length === 8) {
        fetchAddressFromCEP(formData.zip_code);
    }
  }, [formData.zip_code, fetchAddressFromCEP]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const dataToSubmit = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      dataToSubmit.append(key, value);
    });

    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.post('/ongs', dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`ONG "${formData.fantasy_name}" criada com sucesso!`);
      // Limpar o formulário
    } catch (error) {
      console.error("Erro ao criar ONG:", error);
      // ... seu tratamento de erros
    }
  };

  return (
    <ContentWrapper title="Cadastro de Nova ONG">
      <p className={styles.subtitle}>Preencha os dados abaixo para registar uma nova organização.</p>
      <form onSubmit={handleSubmit}>
        <FormSection number="1" title="Informações da ONG">
          <div className={styles.fullWidth}><InputField label="Nome Fantasia da ONG" name="fantasy_name" value={formData.fantasy_name} onChange={handleChange} required /></div>
          <div className={styles.fullWidth}><InputField label="Razão Social" name="corporate_name" value={formData.corporate_name} onChange={handleChange} required /></div>
          <InputField label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleChange} error={errors.cnpj} mask="cnpj" required />
          <InputField label="Data de Fundação" name="foundation_date" type="date" value={formData.foundation_date} onChange={handleChange} />
        </FormSection>

        <FormSection number="2" title="Documentos">
            <div className={styles.fullWidth}><FileUpload label="Logotipo" onFileSelect={(file) => handleFileSelect(file, 'logo')} /></div>
            <div className={styles.fullWidth}><FileUpload label="Última ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" /></div>
            <div className={styles.fullWidth}><FileUpload label="Estatuto Social (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" /></div>
        </FormSection>

        <FormSection number="3" title="Contato e Endereço">
          <InputField label="Email de Contato" name="contact_email" value={formData.contact_email} onChange={handleChange} required />
          <InputField label="Telefone / WhatsApp" name="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} mask="phone" />
          <InputField label="Website" name="website" placeholder="https://..." value={formData.website} onChange={handleChange} />
          <InputField label="Instagram" name="instagram" placeholder="@seu_perfil" value={formData.instagram} onChange={handleChange} />
          
          {/* CAMPO DE CEP ATUALIZADO */}
          <InputField 
            label="CEP" 
            name="zip_code" 
            placeholder="xxxxx-xxx" 
            value={formData.zip_code} 
            onChange={handleCepChange} // Usa a nova função
            disabled={isFetchingCep} 
            required 
          />
          
          <InputField label="Endereço (Rua, Av..)" name="address" value={formData.address} onChange={handleChange} disabled={isFetchingCep} required />
          <InputField label="Número" name="address_number" value={formData.address_number} onChange={handleChange} required />
          <InputField label="Bairro" name="district" value={formData.district} onChange={handleChange} disabled={isFetchingCep} required />
          <InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} disabled={isFetchingCep} required />
          <InputField label="Estado" name="state" value={formData.state} onChange={handleChange} disabled={isFetchingCep} required />
          <div className={styles.fullWidth}><InputField label="País" name="country" value={formData.country} onChange={handleChange} disabled={isFetchingCep} /></div>
        </FormSection>

        <FormSection number="4" title="Informações do Responsável Legal">
          <InputField label="Nome do Responsável" name="responsible_name" value={formData.responsible_name} onChange={handleChange} required />
          <InputField label="CPF do Responsável" name="responsible_cpf" placeholder="000.000.000-00" value={formData.responsible_cpf} onChange={handleChange} error={errors.responsible_cpf} mask="cpf" required />
          <InputField label="Email do Responsável" name="responsible_email" value={formData.responsible_email} onChange={handleChange} error={errors.responsible_email} required />
          <InputField label="Telefone do Responsável" name="responsible_phone" type="tel" value={formData.responsible_phone} onChange={handleChange} mask="phone" />
          <InputField label="Senha Provisória" name="responsible_password" type="password" value={formData.responsible_password} onChange={handleChange} required />
        </FormSection>

        <div className={styles.submitButton}>
            <Button type="submit" disabled={isFetchingCep}>
              {isFetchingCep ? 'A buscar CEP...' : 'Finalizar Cadastro da ONG'}
            </Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateOngPage;