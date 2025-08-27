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
  const [errors, setErrors] = useState({});
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileSelect = (file) => {
    setLogoFile(file);
  };

  // Função para buscar o endereço a partir do CEP
  const fetchAddressFromCEP = useCallback(async (cep) => {
    const cleanCep = cep.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    if (cleanCep.length !== 8) {
      return; // Só busca se tiver 8 dígitos
    }

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

  // useEffect para observar mudanças no campo do CEP
  useEffect(() => {
    fetchAddressFromCEP(formData.zip_code);
  }, [formData.zip_code, fetchAddressFromCEP]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const dataToSubmit = new FormData();
    
    // Remove os campos de "Detalhes de Atuação" antes de enviar
    const { main_area, target_audience, mission, ...restOfData } = formData;

    Object.entries(restOfData).forEach(([key, value]) => {
      dataToSubmit.append(key, value);
    });

    if (logoFile) {
      dataToSubmit.append('logo_file', logoFile);
    }

    try {
      await api.post('/ongs', dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`ONG "${formData.fantasy_name}" criada com sucesso!`);
      // Limpar o formulário
    } catch (error) {
      console.error("Erro ao criar ONG:", error);
      // ... (seu tratamento de erros)
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
          <InputField label="CEP" name="zip_code" placeholder="00000-000" value={formData.zip_code} onChange={handleChange} disabled={isFetchingCep} />
          <InputField label="Endereço (Rua, Av..)" name="address" value={formData.address} onChange={handleChange} disabled={isFetchingCep} />
          <InputField label="Número" name="address_number" value={formData.address_number} onChange={handleChange} />
          <InputField label="Bairro" name="district" value={formData.district} onChange={handleChange} disabled={isFetchingCep} />
          <InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} disabled={isFetchingCep} />
          <InputField label="Estado" name="state" value={formData.state} onChange={handleChange} disabled={isFetchingCep} />
          <div className={styles.fullWidth}><InputField label="País" name="country" value={formData.country} onChange={handleChange} disabled={isFetchingCep} /></div>
        </FormSection>

        {/* A SECÇÃO "DETALHES DA ATUAÇÃO" FOI REMOVIDA */}

        <FormSection number="3" title="Informações do Responsável Legal">
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