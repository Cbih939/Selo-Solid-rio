// Arquivo: src/pages/admin5/CreateOngPage/CreateOngPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import axios from 'axios';
import styles from './CreateOngPage.module.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

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
  const [showPassword, setShowPassword] = useState(false);

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

    for (const key in formData) {
      if (!key.startsWith('coordinator_')) {
        dataToSubmit.append(key, formData[key]);
      }
    }
    
    dataToSubmit.append('responsible_name', formData.coordinator_name);
    dataToSubmit.append('responsible_cpf', formData.coordinator_cpf);
    dataToSubmit.append('responsible_email', formData.coordinator_email);
    dataToSubmit.append('responsible_phone', formData.coordinator_phone);
    dataToSubmit.append('responsible_password', formData.coordinator_password);

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
      window.scrollTo(0, 0);
      
      setTimeout(() => setSuccessMessage(''), 5000);
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
  const buttonText = isFetchingCep ? 'A buscar CEP...' : (isSubmitting ? 'A Guardar...' : '✅ Concluir Cadastro da OSC');

  return (
    <ContentWrapper title="Cadastrar Nova OSC">
      <div className={styles.formContainer}>
        
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
        {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}

        <div className={styles.headerBlock}>
          <h2 className={styles.mainTitle}>Nova Organização</h2>
          <p className={styles.introText}>
            Preencha os dados abaixo para registrar uma nova Organização da Sociedade Civil (OSC) no ecossistema do Selo Cidadania.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* SESSÃO 1: INFORMAÇÕES DA OSC */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Identificação da OSC</h3>
            
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Fantasia *</label>
                <input type="text" name="fantasy_name" required value={formData.fantasy_name} onChange={handleChange} placeholder="Ex: Instituto Exemplo" />
              </div>
              <div className={styles.inputGroup}>
                <label>Razão Social *</label>
                <input type="text" name="corporate_name" required value={formData.corporate_name} onChange={handleChange} placeholder="Associação Exemplo de Vida" />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>CNPJ *</label>
                <input 
                  type="text" name="cnpj" required 
                  value={formData.cnpj} onChange={handleChange} 
                  placeholder="00.000.000/0000-00" 
                  className={errors.cnpj ? styles.inputError : ''}
                />
                {errors.cnpj && <span className={styles.errorText}>{errors.cnpj}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>Data de Fundação</label>
                <input type="date" name="foundation_date" value={formData.foundation_date} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SESSÃO 2: DOCUMENTOS */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>2. Documentação e Identidade Visual</h3>
            
            <div className={styles.grid3}>
              <FileUpload label="Logotipo da OSC" onFileSelect={(file) => handleFileSelect(file, 'logo')} accept="image/*" />
              <FileUpload label="Última ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" />
              <FileUpload label="Estatuto Social (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" />
            </div>
          </div>

          {/* SESSÃO 3: CONTATO E ENDEREÇO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>3. Contatos e Localização</h3>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>E-mail Corporativo da OSC *</label>
                <input type="email" name="contact_email" required value={formData.contact_email} onChange={handleChange} placeholder="contato@osc.org.br" />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefone Institucional / WhatsApp</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
              </div>
              <div className={styles.inputGroup}>
                <label>Instagram</label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@perfil_da_osc" />
              </div>
            </div>

            <div className={styles.inputGroup}>
                <label>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.osc.org.br" />
            </div>

            <hr style={{ margin: '25px 0', border: 'none', borderTop: '1px dashed #cbd5e1' }} />

            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>CEP *</label>
                <input 
                  type="text" name="zip_code" required disabled={isLoading}
                  value={formData.zip_code} onChange={handleCepChange} 
                  placeholder="00000-000" 
                  className={errors.zip_code ? styles.inputError : ''}
                />
                {errors.zip_code && <span className={styles.errorText}>{errors.zip_code}</span>}
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label>Logradouro / Rua *</label>
                <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Avenida Brasil" />
              </div>
            </div>

            <div className={styles.grid4}>
              <div className={styles.inputGroup}>
                <label>Número *</label>
                <input type="text" name="address_number" required value={formData.address_number} onChange={handleChange} placeholder="1000" />
              </div>
              <div className={styles.inputGroup}>
                <label>Complemento</label>
                <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Sala 2" />
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
                <input type="text" name="state" required value={formData.state} onChange={handleChange} placeholder="SP" maxLength="2" />
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
                <input 
                  type="text" name="president_cpf" required 
                  value={formData.president_cpf} onChange={handleChange} 
                  placeholder="000.000.000-00"
                  className={errors.president_cpf ? styles.inputError : ''}
                />
                {errors.president_cpf && <span className={styles.errorText}>{errors.president_cpf}</span>}
              </div>
            </div>
          </div>

          {/* SESSÃO 5: COORDENADOR (ACESSO AO SISTEMA) */}
          <div className={`${styles.sectionBlock} ${styles.highlightSection}`}>
            <h3 className={styles.sectionTitle} style={{ borderBottomColor: '#fed7aa', color: '#c2410c' }}>
              5. Acesso ao Sistema (Coordenador da OSC)
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
              Atenção: Os dados informados abaixo serão utilizados para criar a conta inicial para a OSC aceder à plataforma Selo Cidadania.
            </p>
            
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Completo do Coordenador *</label>
                <input type="text" name="coordinator_name" required value={formData.coordinator_name} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>CPF do Coordenador *</label>
                <input 
                  type="text" name="coordinator_cpf" required 
                  value={formData.coordinator_cpf} onChange={handleChange} 
                  placeholder="000.000.000-00"
                  className={errors.coordinator_cpf ? styles.inputError : ''}
                />
                {errors.coordinator_cpf && <span className={styles.errorText}>{errors.coordinator_cpf}</span>}
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>Telefone do Coordenador</label>
                <input type="text" name="coordinator_phone" value={formData.coordinator_phone} onChange={handleChange} placeholder="(00) 00000-0000" />
              </div>
              <div className={styles.inputGroup}>
                <label>E-mail de Acesso (Login) *</label>
                <input 
                  type="email" name="coordinator_email" required 
                  value={formData.coordinator_email} onChange={handleChange} 
                  className={errors.coordinator_email ? styles.inputError : ''}
                />
                {errors.coordinator_email && <span className={styles.errorText}>{errors.coordinator_email}</span>}
              </div>
              
              <div className={styles.inputGroup}>
                <label>Senha Provisória do Sistema *</label>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="coordinator_password" 
                    required 
                    value={formData.coordinator_password} 
                    onChange={handleChange} 
                    placeholder="******"
                    className={styles.passwordInput}
                  />
                  <span 
                    className={styles.eyeIconBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', padding: '12px 24px', fontSize: '1rem' }} disabled={isLoading}>
              {buttonText}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateOngPage;