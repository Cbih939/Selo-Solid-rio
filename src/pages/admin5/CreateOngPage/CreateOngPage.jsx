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
  // Estado inicial do formulário
  const initialFormData = {
    fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '',
    contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
    address: '', address_number: '', district: '', city: '', state: '', country: 'Brasil',
    responsible_name: '', responsible_cpf: '', responsible_email: '', responsible_phone: '', responsible_password: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);
  
  // Estados para controle da UI
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Função genérica para lidar com mudanças nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa o erro do campo ao ser modificado
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Função para lidar com o CEP, mantendo a máscara
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
    setFormData(prev => ({ ...prev, zip_code: value }));
  };

  // Função para lidar com a seleção de arquivos
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
    setErrors(prev => ({ ...prev, zip_code: null })); // Limpa erro anterior
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

  // Efeito que observa a mudança no campo CEP para disparar a busca
  useEffect(() => {
    const cleanCep = formData.zip_code.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressFromCEP(formData.zip_code);
    }
  }, [formData.zip_code, fetchAddressFromCEP]);

  // Função de submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setIsSubmitting(true);

    const dataToSubmit = new FormData();
    // Adiciona todos os campos do formulário ao FormData
    Object.entries(formData).forEach(([key, value]) => dataToSubmit.append(key, value));
    
    // Adiciona os arquivos se eles existirem
    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.post('/ongs', dataToSubmit, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      setSuccessMessage(`ONG "${formData.fantasy_name}" criada com sucesso!`);
      
      // Limpa o formulário e os estados
      setFormData(initialFormData);
      setLogoFile(null);
      setAtaFile(null);
      setStatuteFile(null);
      // Opcional: resetar os componentes de FileUpload se eles tiverem uma função para isso
      
    } catch (err) {
      const errorData = err.response?.data;
      console.error("Erro ao criar ONG:", errorData || err.message);
      
      if (errorData && typeof errorData.error === 'string') {
        // Trata erros genéricos ou de duplicidade
        setErrors({ submit: errorData.error });
      } else {
        setErrors({ submit: 'Não foi possível criar a ONG. Verifique os dados e tente novamente.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isFetchingCep || isSubmitting;
  const buttonText = isFetchingCep ? 'Buscando CEP...' : (isSubmitting ? 'Enviando...' : 'Finalizar Cadastro da ONG');

  return (
    <ContentWrapper title="Cadastro de Nova ONG">
      <p className={styles.subtitle}>Preencha os dados abaixo para registrar uma nova organização.</p>
      
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      
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
          {/* Upload de Logo (não precisa de helpText, usa o padrão) */}
            <FileUpload 
              label="Logotipo" 
              onFileSelect={(file) => handleFileSelect(file, 'logo')} 
              accept="image/*" 
            />
          </div>
          <div className={styles.fullWidth}>
          {/* --- CORREÇÃO --- */}
          {/* Upload de ATA (com texto de ajuda customizado) */}
            <FileUpload 
              label="Última ATA (.pdf)" 
              onFileSelect={(file) => handleFileSelect(file, 'ata')} 
              accept="application/pdf"
              helpText="PDF até 10MB" 
            />
          </div>
          <div className={styles.fullWidth}>
          {/* --- CORREÇÃO --- */}
          {/* Upload de Estatuto (com texto de ajuda customizado) */}
            <FileUpload 
              label="Estatuto Social (.pdf)" 
              onFileSelect={(file) => handleFileSelect(file, 'statute')} 
              accept="application/pdf"
               helpText="PDF até 10MB"
            />
          </div>
        </FormSection>

        <FormSection number="3" title="Contato e Endereço">
          <InputField label="Email de Contato" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} required />
          <InputField label="Telefone / WhatsApp" name="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} mask="phone" />
          <InputField label="Website" name="website" type="url" placeholder="https://..." value={formData.website} onChange={handleChange} />
          <InputField label="Instagram" name="instagram" placeholder="@seu_perfil" value={formData.instagram} onChange={handleChange} />

          <InputField 
            label="CEP"
            name="zip_code"
            placeholder="xxxxx-xxx"
            value={formData.zip_code}
            onChange={handleCepChange}
            error={errors.zip_code}
            disabled={isLoading}
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
          <InputField label="Email" name="responsible_email" type="email" value={formData.responsible_email} onChange={handleChange} error={errors.responsible_email} required />
          <InputField label="Telefone" name="responsible_phone" type="tel" value={formData.responsible_phone} onChange={handleChange} mask="phone" />
          <InputField label="Senha Provisória" name="responsible_password" type="password" value={formData.responsible_password} onChange={handleChange} required />
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
