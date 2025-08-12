import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FormSection from '../../../components/ui/FormSection/FormSection';
import InputField from '../../../components/ui/InputField/InputField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import SelectField from '../../../components/ui/SelectField/SelectField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import LocationSelector from '../../../components/ui/LocationSelector/LocationSelector'; // Importa o componente
import styles from './CreateOngPage.module.css';
import api from '../../../api/api';

const CreateOngPage = () => {
  const [formData, setFormData] = useState({
    fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '', logo_url: '',
    contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
    address: '', address_number: '', district: '', city: '', state: '', country: 'Brasil',
    main_area: 'Educação', target_audience: '', mission: '',
    responsible_name: '', responsible_cpf: '', responsible_email: '', responsible_phone: '', responsible_password: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Função para receber as alterações do LocationSelector
  const handleLocationChange = ({ state, city }) => {
    setFormData(prevState => ({
      ...prevState,
      state: state,
      city: city,
    }));
  };

  const handleFileSelect = (file) => {
    setLogoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await api.post('/ongs', formData);
      alert(`ONG "${formData.fantasy_name}" criada com sucesso!`);
      // Limpa o formulário
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('CNPJ')) setErrors({ cnpj: errorMessage });
        if (errorMessage.includes('email')) setErrors({ responsible_email: errorMessage });
        if (errorMessage.includes('CPF')) setErrors({ responsible_cpf: errorMessage });
      } else {
        alert("Ocorreu um erro. Verifique a consola.");
      }
    }
  };

  return (
    <ContentWrapper title="Cadastro de Nova ONG">
      <p className={styles.subtitle}>Preencha os dados abaixo para registar uma nova organização.</p>
      <form onSubmit={handleSubmit}>
        <FormSection number="1" title="Informações da ONG">
          <div className={styles.fullWidth}><InputField label="Nome Fantasia da ONG" name="fantasy_name" value={formData.fantasy_name} onChange={handleChange} /></div>
          <div className={styles.fullWidth}><InputField label="Razão Social" name="corporate_name" value={formData.corporate_name} onChange={handleChange} /></div>
          <InputField label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleChange} error={errors.cnpj} mask="cnpj" />
          <InputField label="Data de Fundação" name="foundation_date" type="date" value={formData.foundation_date} onChange={handleChange} />
          <div className={styles.fullWidth}><FileUpload label="Logotipo" onFileSelect={handleFileSelect} /></div>
        </FormSection>

        <FormSection number="2" title="Contato e Endereço">
          <InputField label="Email de Contato" name="contact_email" value={formData.contact_email} onChange={handleChange} />
          <InputField label="Telefone / WhatsApp" name="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} mask="phone" />
          <InputField label="Website" name="website" placeholder="https://..." value={formData.website} onChange={handleChange} />
          <InputField label="Instagram" name="instagram" placeholder="@seu_perfil" value={formData.instagram} onChange={handleChange} />
          <InputField label="CEP" name="zip_code" placeholder="00000-000" value={formData.zip_code} onChange={handleChange} />
          <InputField label="Endereço (Rua, Av..)" name="address" value={formData.address} onChange={handleChange} />
          <InputField label="Número" name="address_number" value={formData.address_number} onChange={handleChange} />
          <InputField label="Bairro" name="district" value={formData.district} onChange={handleChange} />
          
          {/* CORREÇÃO: Usa o componente LocationSelector */}
          <LocationSelector 
            onLocationChange={handleLocationChange} 
            initialLocation={{ state: formData.state, city: formData.city }}
          />

          <div className={styles.fullWidth}><InputField label="País" name="country" value={formData.country} onChange={handleChange} /></div>
        </FormSection>

        <FormSection number="3" title="Detalhes da Atuação">
            <div className={styles.fullWidth}>
                <SelectField label="Área de Atuação Principal" name="main_area" value={formData.main_area} onChange={handleChange}>
                    <option>Educação</option>
                    <option>Saúde</option>
                    <option>Meio Ambiente</option>
                    <option>Assistência Social</option>
                    <option>Cultura</option>
                    <option>Direitos Humanos</option>
                </SelectField>
            </div>
            <div className={styles.fullWidth}>
                <TextareaField label="Público-Alvo" name="target_audience" placeholder="Ex: Crianças, idosos, etc." value={formData.target_audience} onChange={handleChange} />
            </div>
            <div className={styles.fullWidth}>
                <TextareaField label="Missão da ONG" name="mission" placeholder="Descreva a proposta e os objetivos da organização." value={formData.mission} onChange={handleChange} />
            </div>
        </FormSection>

        <FormSection number="4" title="Informações do Responsável Legal">
            <InputField label="Nome do Responsável" name="responsible_name" value={formData.responsible_name} onChange={handleChange} />
            <InputField label="CPF do Responsável" name="responsible_cpf" placeholder="000.000.000-00" value={formData.responsible_cpf} onChange={handleChange} error={errors.responsible_cpf} mask="cpf" />
            <InputField label="Email do Responsável" name="responsible_email" value={formData.responsible_email} onChange={handleChange} error={errors.responsible_email} />
            <InputField label="Telefone do Responsável" name="responsible_phone" type="tel" value={formData.responsible_phone} onChange={handleChange} mask="phone" />
            <InputField label="Senha Provisória" name="responsible_password" type="password" value={formData.responsible_password} onChange={handleChange} />
        </FormSection>

        <div className={styles.submitButton}>
            <Button type="submit">Finalizar Cadastro da ONG</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateOngPage;