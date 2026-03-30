// Arquivo: src/pages/ong/EditOngPage/EditOngPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import axios from 'axios';
import styles from './EditOngPage.module.css';

const EditOngPage = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '',
    contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
    address: '', address_number: '', complemento: '', district: '', city: '', state: '', country: 'Brasil',
    president_name: '', president_cpf: '',
    coordinator_name: '', coordinator_cpf: '', coordinator_phone: '', coordinator_email: '', coordinator_password: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);

  const ongId = user?.ong_id || user?.id;

  // Carregar os dados atuais da OSC
  useEffect(() => {
    const fetchOngData = async () => {
      try {
        const response = await api.get(`/ongs/${ongId}`);
        const data = response.data;
        
        setFormData({
          fantasy_name: data.fantasy_name || '',
          corporate_name: data.corporate_name || '',
          cnpj: data.cnpj || '',
          foundation_date: data.foundation_date ? data.foundation_date.split('T')[0] : '',
          contact_email: data.contact_email || '',
          phone: data.phone || '',
          website: data.website || '',
          instagram: data.instagram || '',
          zip_code: data.zip_code || data.cep || '',
          address: data.address || data.logradouro || '',
          address_number: data.address_number || data.numero || '',
          complemento: data.complemento || '',
          district: data.district || data.bairro || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'Brasil',
          president_name: data.president_name || '',
          president_cpf: data.president_cpf || '',
          coordinator_name: data.responsible_name || '',
          coordinator_cpf: data.responsible_cpf || '',
          coordinator_phone: data.responsible_phone || '',
          coordinator_email: data.responsible_email || '',
          coordinator_password: '', // Deixamos em branco para não sobreescrever se não for digitado
        });
      } catch (error) {
        console.error("Erro ao buscar dados da OSC:", error);
        setErrorMsg("Não foi possível carregar os dados da organização.");
      } finally {
        setLoading(false);
      }
    };

    if (ongId) fetchOngData();
  }, [ongId]);

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
    setErrorMsg('');
    setIsSubmitting(true);

    const dataToSubmit = new FormData();

    // Adiciona os campos de texto
    for (const key in formData) {
      if (!key.startsWith('coordinator_') && formData[key] !== null) {
        dataToSubmit.append(key, formData[key]);
      }
    }
    
    // Mapeia os dados do coordenador para o formato do Backend
    dataToSubmit.append('responsible_name', formData.coordinator_name);
    dataToSubmit.append('responsible_cpf', formData.coordinator_cpf);
    dataToSubmit.append('responsible_email', formData.coordinator_email);
    dataToSubmit.append('responsible_phone', formData.coordinator_phone);
    if (formData.coordinator_password && formData.coordinator_password.trim() !== '') {
      dataToSubmit.append('responsible_password', formData.coordinator_password);
    }

    // Adiciona os arquivos se o utilizador enviou novos
    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.put(`/ongs/${ongId}`, dataToSubmit);
      setSuccessMessage('Dados da OSC atualizados com sucesso!');
      window.scrollTo(0, 0);
      
      // Limpa a senha para não ficar no input
      setFormData(prev => ({...prev, coordinator_password: ''}));
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const errorData = err.response?.data;
      console.error("Erro ao atualizar OSC:", errorData || err.message);
      setErrorMsg(errorData?.error || 'Não foi possível atualizar a OSC. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBtnDisabled = isFetchingCep || isSubmitting;
  const buttonText = isFetchingCep ? 'A buscar CEP...' : (isSubmitting ? 'A Guardar...' : 'Salvar Alterações da OSC');

  if (loading) {
    return <ContentWrapper title="Editar Informações da OSC"><p style={{padding: '20px'}}>A carregar dados...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Editar Informações da OSC">
      <div className={styles.formContainer}>
        
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <p className={styles.introText}>
          Mantenha os dados cadastrais da sua Organização atualizados. Altere as informações abaixo conforme necessário.
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* SESSÃO 1: INFORMAÇÕES DA OSC */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Identificação da OSC</h3>
            
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Fantasia *</label>
                <input type="text" name="fantasy_name" required value={formData.fantasy_name} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Razão Social *</label>
                <input type="text" name="corporate_name" required value={formData.corporate_name} onChange={handleChange} />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>CNPJ <small>(Não pode ser alterado)</small></label>
                <input type="text" name="cnpj" value={formData.cnpj} disabled className={styles.inputDisabled} />
              </div>
              <div className={styles.inputGroup}>
                <label>Data de Fundação</label>
                <input type="date" name="foundation_date" value={formData.foundation_date} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SESSÃO 2: DOCUMENTOS (Atualizado para PDF) */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>2. Documentação e Identidade Visual</h3>
            <p className={styles.documentHint}>
              Carregue novos ficheiros apenas se desejar substituir os atuais. Formatos aceites: Imagens (Logo) e PDF (Ata/Estatuto).
            </p>
            
            <div className={styles.grid3}>
              <FileUpload label="Atualizar Logotipo" onFileSelect={(file) => handleFileSelect(file, 'logo')} accept="image/*" />
              <FileUpload label="Atualizar ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" />
              <FileUpload label="Atualizar Estatuto (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" />
            </div>
          </div>

          {/* SESSÃO 3: CONTATO E ENDEREÇO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>3. Contatos e Localização</h3>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>E-mail Institucional *</label>
                <input type="email" name="contact_email" required value={formData.contact_email} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefone / WhatsApp</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Instagram</label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} />
              </div>
            </div>

            <div className={styles.inputGroup}>
                <label>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} />
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px dashed #e2e8f0' }} />

            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>CEP *</label>
                <input 
                  type="text" name="zip_code" required disabled={isLoading}
                  value={formData.zip_code} onChange={handleCepChange} 
                  className={errors.zip_code ? styles.inputError : ''}
                />
                {errors.zip_code && <span className={styles.errorText}>{errors.zip_code}</span>}
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label>Logradouro / Rua *</label>
                <input type="text" name="address" required value={formData.address} onChange={handleChange} />
              </div>
            </div>

            <div className={styles.grid4}>
              <div className={styles.inputGroup}>
                <label>Número *</label>
                <input type="text" name="address_number" required value={formData.address_number} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Complemento</label>
                <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Bairro *</label>
                <input type="text" name="district" required value={formData.district} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Cidade *</label>
                <input type="text" name="city" required value={formData.city} onChange={handleChange} />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Estado (UF) *</label>
                <input type="text" name="state" required value={formData.state} onChange={handleChange} maxLength="2" />
              </div>
              <div className={styles.inputGroup}>
                <label>País</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SESSÃO 4: PRESIDENTE */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>4. Responsável Legal (Presidente)</h3>
            
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Completo *</label>
                <input type="text" name="president_name" required value={formData.president_name} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>CPF *</label>
                <input type="text" name="president_cpf" required value={formData.president_cpf} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SESSÃO 5: COORDENADOR (OS 3 NA MESMA LINHA) */}
          <div className={styles.sectionBlock} style={{ border: '2px solid #e0f2fe', backgroundColor: '#f8fafc' }}>
            <h3 className={styles.sectionTitle} style={{ borderBottomColor: '#bae6fd' }}>
              5. Dados do Coordenador (Acesso ao Sistema)
            </h3>
            
            {/* Os 3 campos na mesma linha */}
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>Nome do Coordenador *</label>
                <input type="text" name="coordinator_name" required value={formData.coordinator_name} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>CPF do Coordenador *</label>
                <input type="text" name="coordinator_cpf" required value={formData.coordinator_cpf} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefone do Coordenador</label>
                <input type="text" name="coordinator_phone" value={formData.coordinator_phone} onChange={handleChange} />
              </div>
            </div>

            {/* Restantes dados de acesso */}
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>E-mail de Acesso (Login) <small>(Não editável)</small></label>
                <input type="email" name="coordinator_email" value={formData.coordinator_email} disabled className={styles.inputDisabled} />
              </div>
              <div className={styles.inputGroup}>
                <label>Nova Senha Provisória <small>(Deixe em branco para não alterar)</small></label>
                <input type="password" name="coordinator_password" value={formData.coordinator_password} onChange={handleChange} placeholder="******" />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            {onNavigate && (
               <Button type="button" variant="secondary" onClick={() => onNavigate('dashboard')} disabled={isBtnDisabled}>
                 Cancelar
               </Button>
            )}
            <Button type="submit" variant="primary" disabled={isBtnDisabled}>
              {buttonText}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default EditOngPage;