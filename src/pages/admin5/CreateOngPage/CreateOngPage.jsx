import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FormSection from '../../../components/ui/FormSection/FormSection';
import InputField from '../../../components/ui/InputField/InputField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import SelectField from '../../../components/ui/SelectField/SelectField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import LocationSelector from '../../../components/ui/LocationSelector/LocationSelector';
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

  // =====================================================================
  // PASSO 1: VALIDAÇÃO NO FRONTEND (NOVO!)
  // =====================================================================
  const newErrors = {};
  if (!formData.fantasy_name) newErrors.fantasy_name = "Nome Fantasia é obrigatório.";
  if (!formData.corporate_name) newErrors.corporate_name = "Razão Social é obrigatória.";
  if (!formData.cnpj) newErrors.cnpj = "CNPJ é obrigatório.";
  if (!formData.foundation_date) newErrors.foundation_date = "Data de Fundação é obrigatória.";
  if (!formData.contact_email) newErrors.contact_email = "Email de Contato é obrigatório.";
  if (!formData.phone) newErrors.phone = "Telefone é obrigatório.";
  if (!formData.address) newErrors.address = "Endereço é obrigatório.";
  if (!formData.city) newErrors.city = "Cidade é obrigatória.";
  if (!formData.state) newErrors.state = "Estado é obrigatório.";
  
  
  // AQUI ESTÃO OS PROVÁVEIS CULPADOS
  if (!formData.mission) newErrors.mission = "A Missão da ONG é um campo obrigatório.";
  if (!formData.target_audience) newErrors.target_audience = "O Público-Alvo é um campo obrigatório.";

  if (!formData.responsible_name) newErrors.responsible_name = "Nome do Responsável é obrigatório.";
  if (!formData.responsible_cpf) newErrors.responsible_cpf = "CPF do Responsável é obrigatório.";
  if (!formData.responsible_email) newErrors.responsible_email = "Email do Responsável é obrigatório.";
  if (!formData.responsible_password) newErrors.responsible_password = "Senha é obrigatória.";
  if (!logoFile) {
      // Se o logo for obrigatório, adicione um alerta ou estado de erro para ele.
      alert("Por favor, selecione um logotipo para a ONG.");
      return; // Para a execução aqui    
  }

  console.log("Campos com erro de validação:", newErrors);
  
  // Se houver qualquer erro no objeto newErrors, atualize o estado e pare a execução.
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    alert("Existem campos obrigatórios não preenchidos. Por favor, verifique o formulário.");
    return; // Impede o envio da requisição para a API
  }
  // =====================================================================


  // PASSO 2: Limpeza e Mapeamento dos dados
const cleanedData = {
  ...formData,
  cnpj: formData.cnpj.replace(/\D/g, ''),
  responsible_cpf: formData.responsible_cpf.replace(/\D/g, ''),
  phone: formData.phone.replace(/\D/g, ''),
  responsible_phone: formData.responsible_phone.replace(/\D/g, ''),
};

const dataToSubmit = new FormData();
const fieldMapping = {
  fantasy_name: 'nome_fantasia',
  corporate_name: 'razao_social',
  foundation_date: 'data_fundacao',
  contact_email: 'email_contato',
  phone: 'telefone',
  zip_code: 'cep',
  address: 'endereco',
  address_number: 'numero_endereco',
  district: 'bairro',
  city: 'cidade',
  state: 'estado',
  country: 'pais',
  main_area: 'area_atuacao_principal',
  target_audience: 'publico_alvo',
  mission: 'missao',
  responsible_name: 'nome_responsavel',
  responsible_cpf: 'cpf_responsavel',
  responsible_email: 'email_responsavel',
  responsible_phone: 'telefone_responsavel',
  responsible_password: 'senha_responsavel',
  // Campos que provavelmente têm o mesmo nome
  cnpj: 'cnpj',
  website: 'website',
  instagram: 'instagram',
};

Object.entries(cleanedData).forEach(([key, value]) => {
  const apiFieldName = fieldMapping[key] || key;
  dataToSubmit.append(apiFieldName, value);
});

if (logoFile) {
  // O nome do arquivo também é crucial. 'logo' ou 'arquivo_logo' são comuns.
  dataToSubmit.append('logo_file', logoFile);
}

  // PASSO 3: Envio para a API
  try {
    await api.post('/ongs', dataToSubmit);
    alert(`ONG "${formData.fantasy_name}" criada com sucesso!`);
  } catch (error) {
    // O tratamento de erro que já fizemos continua aqui...
    console.error("Erro detalhado ao criar ONG:", error);
    console.log("Resposta de erro da API:", error.response?.data);
    if (error.response) {
        const { data } = error.response;
        alert(data.error || data.message || "Ocorreu um erro desconhecido.");
    } else {
        alert("Não foi possível conectar ao servidor.");
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
                <TextareaField label="Público-Alvo" name="target_audience" placeholder="Ex: Crianças, idosos, etc." value={formData.target_audience} onChange={handleChange} error={errors.target_audience} />
            </div>
            <div className={styles.fullWidth}>
                <TextareaField label="Missão da ONG" name="mission" placeholder="Descreva a proposta e os objetivos da organização." value={formData.mission} onChange={handleChange} error={errors.mission} />
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
