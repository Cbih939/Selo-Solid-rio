import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FormSection from '../../../components/ui/FormSection/FormSection';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import styles from './CreateOngPage.module.css';
import api from '../../../api/api'; // axios configurado
import axios from 'axios'; // usado só para ViaCEP

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

  // Função genérica para inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // CEP com máscara
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
    setFormData(prev => ({ ...prev, zip_code: value }));
  };

  // Uploads
  const handleFileSelect = (file, type) => {
    if (type === 'logo') setLogoFile(file);
    if (type === 'ata') setAtaFile(file);
    if (type === 'statute') setStatuteFile(file);
  };

  // Buscar endereço via CEP
  const fetchAddressFromCEP = useCallback(async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setIsFetchingCep(true);
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
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

  // Observa CEP
  useEffect(() => {
    const cleanCep = formData.zip_code.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressFromCEP(formData.zip_code);
    }
  }, [formData.zip_code, fetchAddressFromCEP]);

  // Submissão
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const dataToSubmit = new FormData();
    Object.entries(formData).forEach(([k, v]) => dataToSubmit.append(k, v));
    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.post('/ongs', dataToSubmit, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert(`ONG "${formData.fantasy_name}" criada com sucesso!`);
      // limpar
      setFormData({
        fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '',
        contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
        address: '', address_number: '', district: '', city: '', state: '', country: 'Brasil',
        responsible_name: '', responsible_cpf: '', responsible_email: '', responsible_phone: '', responsible_password: '',
      });
      setLogoFile(null);
      setAtaFile(null);
      setStatuteFile(null);
    } catch (err) {
      console.error("Erro ao criar ONG:", err.response?.data || err.message);
      setErrors(prev => ({ ...prev, submit: 'Não foi possível criar a ONG. Tente novamente.' }));
    }
  };

  return (
    <ContentWrapper title="Cadastro de Nova ONG">
      <p className={styles.subtitle}>Preencha os dados abaixo para registrar uma nova organização.</p>
      <form onSubmit={handleSubmit}>
        <FormSection number="1" title="Informações da ONG">
          <div className={styles.fullWidth}>
            <InputField label="Nome Fantasia da ONG" name="fantasy_name" value={formData.fantasy_name} onChange={handleChange} required />
          </div>
          <div className={styles.fullWidth}>
            <InputField label="Razão Social" name="corporate_name" value={formData.corporate_name} onChange={handleChange} required />
          </div>
          <InputField label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleChange} error={errors.cnpj} mask="cnpj" required />
          <InputField label="Data de Fundação" name="foundation_date" type="date" value={formData.foundation_date} onChange={handleChange} />
        </FormSection>

        <FormSection number="2" title="Documentos">
          <div className={styles.fullWidth}>
            <FileUpload label="Logotipo" onFileSelect={(file) => handleFileSelect(file, 'logo')} accept="image/*" />
          </div>
          <div className={styles.fullWidth}>
            <FileUpload label="Última ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" />
          </div>
          <div className={styles.fullWidth}>
            <FileUpload label="Estatuto Social (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" />
          </div>
        </FormSection>

        <FormSection number="3" title="Contato e Endereço">
          <InputField label="Email de Contato" name="contact_email" value={formData.contact_email} onChange={handleChange} required />
          <InputField label="Telefone / WhatsApp" name="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} mask="phone" />
          <InputField label="Website" name="website" placeholder="https://..." value={formData.website} onChange={handleChange} />
          <InputField label="Instagram" name="instagram" placeholder="@seu_perfil" value={formData.instagram} onChange={handleChange} />

          <InputField 
            label="CEP"
            name="zip_code"
            placeholder="xxxxx-xxx"
            value={formData.zip_code}
            onChange={handleCepChange}
            error={errors.zip_code}
            disabled={isFetchingCep}
            required
          />
          <InputField label="Endereço" name="address" value={formData.address} onChange={handleChange} required />
          <InputField label="Número" name="address_number" value={formData.address_number} onChange={handleChange} required />
          <InputField label="Bairro" name="district" value={formData.district} onChange={handleChange} required />
          <InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} required />
          <InputField label="Estado" name="state" value={formData.state} onChange={handleChange} required />
          <div className={styles.fullWidth}>
            <InputField label="País" name="country" value={formData.country} onChange={handleChange} />
          </div>
        </FormSection>

        <FormSection number="4" title="Responsável Legal">
          <InputField label="Nome" name="responsible_name" value={formData.responsible_name} onChange={handleChange} required />
          <InputField label="CPF" name="responsible_cpf" placeholder="000.000.000-00" value={formData.responsible_cpf} onChange={handleChange} error={errors.responsible_cpf} mask="cpf" required />
          <InputField label="Email" name="responsible_email" value={formData.responsible_email} onChange={handleChange} error={errors.responsible_email} required />
          <InputField label="Telefone" name="responsible_phone" type="tel" value={formData.responsible_phone} onChange={handleChange} mask="phone" />
          <InputField label="Senha Provisória" name="responsible_password" type="password" value={formData.responsible_password} onChange={handleChange} required />
        </FormSection>

        {errors.submit && <p className={styles.error}>{errors.submit}</p>}

        <div className={styles.submitButton}>
          <Button type="submit" disabled={isFetchingCep}>
            {isFetchingCep ? 'Buscando CEP...' : 'Finalizar Cadastro da ONG'}
          </Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateOngPage;