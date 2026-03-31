// Arquivo: src/pages/ong/EditOngPage/EditOngPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import axios from 'axios';
import styles from './EditOngPage.module.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const EditOngPage = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});

  // --- DADOS DA ONG ---
  const [formData, setFormData] = useState({
    fantasy_name: '', corporate_name: '', cnpj: '', foundation_date: '',
    contact_email: '', phone: '', website: '', instagram: '', zip_code: '',
    address: '', address_number: '', complemento: '', district: '', city: '', state: '', country: 'Brasil',
    president_name: '', president_cpf: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);

  // --- GESTÃO DE ADMINISTRADORES (MÁXIMO 5) ---
  const [admins, setAdmins] = useState([]);
  const [adminModal, setAdminModal] = useState({ isOpen: false, mode: 'add' });
  const [adminFormData, setAdminFormData] = useState({ id: '', name: '', cpf: '', phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const ongId = user?.ong_id || user?.id;

  useEffect(() => {
    const fetchOngData = async () => {
      try {
        // 1. Busca os dados da ONG
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
          president_cpf: data.president_cpf || ''
        });

        // 2. Busca os administradores vinculados à ONG
        try {
          const adminsRes = await api.get(`/ongs/${ongId}/admins`);
          setAdmins(adminsRes.data || []);
        } catch (err) {
          console.warn("Rota de administradores ainda não existe ou retornou erro. Tentando ler dos dados principais.");
          // Fallback caso a rota dedicada ainda não exista
          if (data.responsible_email) {
            setAdmins([{
              id: 'main',
              name: data.responsible_name,
              cpf: data.responsible_cpf,
              phone: data.responsible_phone,
              email: data.responsible_email
            }]);
          }
        }

      } catch (error) {
        console.error("Erro ao buscar dados da OSC:", error);
        setErrorMsg("Não foi possível carregar os dados da organização.");
      } finally {
        setLoading(false);
      }
    };

    if (ongId) fetchOngData();
  }, [ongId]);

  // ==========================================
  // LÓGICA PRINCIPAL DA ONG
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
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
          ...prev, address: data.logradouro, district: data.bairro, city: data.localidade, state: data.uf,
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
    if (cleanCep.length === 8) fetchAddressFromCEP(formData.zip_code);
  }, [formData.zip_code, fetchAddressFromCEP]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); setSuccessMessage(''); setErrorMsg(''); setIsSubmitting(true);

    const dataToSubmit = new FormData();
    for (const key in formData) {
      if (formData[key] !== null) dataToSubmit.append(key, formData[key]);
    }
    
    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.put(`/ongs/${ongId}`, dataToSubmit);
      setSuccessMessage('Dados da Instituição atualizados com sucesso!');
      window.scrollTo(0, 0);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const errorData = err.response?.data;
      setErrorMsg(errorData?.error || 'Não foi possível atualizar a OSC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LÓGICA DOS ADMINISTRADORES (MÁX 5)
  // ==========================================
  const fetchAdmins = async () => {
    try {
      const adminsRes = await api.get(`/ongs/${ongId}/admins`);
      setAdmins(adminsRes.data || []);
    } catch (err) { console.error("Erro ao atualizar lista de admins", err); }
  };

  const openAdminModal = (mode, admin = null) => {
    if (mode === 'add' && admins.length >= 5) {
      alert("O limite máximo é de 5 administradores por Instituição.");
      return;
    }
    setAdminModal({ isOpen: true, mode });
    setAdminFormData(admin ? { ...admin, password: '' } : { id: '', name: '', cpf: '', phone: '', email: '', password: '' });
    setShowPassword(false);
  };

  const handleAdminFormChange = (e) => {
    setAdminFormData({ ...adminFormData, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminSubmitting(true);
    
    try {
      if (adminModal.mode === 'add') {
        // Rota esperada no backend para adicionar administrador
        await api.post(`/ongs/${ongId}/admins`, adminFormData);
        alert('Administrador adicionado com sucesso!');
      } else {
        // Rota esperada no backend para editar administrador (ID = id do usuário)
        await api.put(`/ongs/${ongId}/admins/${adminFormData.id}`, adminFormData);
        alert('Dados do administrador atualizados com sucesso!');
      }
      setAdminModal({ isOpen: false, mode: 'add' });
      fetchAdmins(); // Atualiza a lista
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar administrador. Verifique as rotas no backend.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (admins.length === 1) {
      alert("A instituição deve ter pelo menos um administrador.");
      return;
    }
    if (window.confirm("Tem certeza que deseja remover este administrador? Ele perderá o acesso ao painel.")) {
      try {
        await api.delete(`/ongs/${ongId}/admins/${adminId}`);
        fetchAdmins();
        alert('Administrador removido com sucesso.');
      } catch (error) {
        alert(error.response?.data?.error || 'Erro ao remover administrador.');
      }
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

            <hr className={styles.divider} />

            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>CEP *</label>
                <input 
                  type="text" name="zip_code" required disabled={isFetchingCep}
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

          <div className={styles.formActions} style={{ marginBottom: '40px' }}>
            <Button type="submit" variant="primary" disabled={isBtnDisabled} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
              {buttonText}
            </Button>
          </div>
        </form>

        {/* ============================================================== */}
        {/* NOVA SESSÃO 5: LISTAGEM DE ADMINISTRADORES (MULTIUSUÁRIOS) */}
        {/* ============================================================== */}
        <div className={`${styles.sectionBlock} ${styles.highlightSection}`}>
          <div className={styles.adminHeader}>
            <h3 className={styles.sectionTitleHighlight} style={{ borderBottom: 'none', margin: 0, padding: 0 }}>
              5. Administradores da Instituição
            </h3>
            <Button 
              type="button" 
              onClick={() => openAdminModal('add')} 
              disabled={admins.length >= 5}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontSize: '0.85rem', padding: '8px 12px' }}
            >
              + Novo Administrador ({admins.length}/5)
            </Button>
          </div>
          
          <p className={styles.documentHint} style={{ marginBottom: '20px' }}>
            Os administradores listados abaixo têm acesso ao painel da sua OSC. É permitido alterar o e-mail de acesso e a senha a qualquer momento.
          </p>

          <div className={styles.adminGrid}>
            {admins.map((admin, index) => (
              <div key={admin.id || index} className={styles.adminCard}>
                <div className={styles.adminInfo}>
                  <strong>{admin.name}</strong>
                  <span>{admin.email}</span>
                  <small>CPF: {admin.cpf || 'Não informado'} | Tel: {admin.phone || 'Não informado'}</small>
                </div>
                <div className={styles.adminActions}>
                  <button type="button" className={styles.editBtn} onClick={() => openAdminModal('edit', admin)}>Editar</button>
                  <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteAdmin(admin.id)}>Remover</button>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <p style={{ color: '#ea580c', fontStyle: 'italic' }}>Nenhum administrador encontrado ou API pendente.</p>
            )}
          </div>
        </div>

      </div>

      {/* --- MODAL PARA ADICIONAR / EDITAR ADMINISTRADOR --- */}
      <Modal 
        isOpen={adminModal.isOpen} 
        onClose={() => setAdminModal({ isOpen: false, mode: 'add' })} 
        title={adminModal.mode === 'add' ? 'Adicionar Novo Administrador' : 'Editar Administrador'}
      >
        <form onSubmit={handleAdminSubmit} className={styles.modalContent}>
          <div className={styles.inputGroup}>
            <label>Nome Completo *</label>
            <input type="text" name="name" required value={adminFormData.name} onChange={handleAdminFormChange} />
          </div>
          
          <div className={styles.grid2} style={{ marginBottom: 0 }}>
            <div className={styles.inputGroup}>
              <label>CPF *</label>
              <input type="text" name="cpf" required value={adminFormData.cpf} onChange={handleAdminFormChange} />
            </div>
            <div className={styles.inputGroup}>
              <label>Telefone / WhatsApp</label>
              <input type="text" name="phone" value={adminFormData.phone} onChange={handleAdminFormChange} />
            </div>
          </div>

          <div className={styles.grid2} style={{ marginBottom: 0 }}>
            {/* EMAIL AGORA É EDITÁVEL */}
            <div className={styles.inputGroup}>
              <label>E-mail de Acesso (Login) *</label>
              <input type="email" name="email" required value={adminFormData.email} onChange={handleAdminFormChange} />
            </div>

            <div className={styles.inputGroup}>
              <label>Senha de Acesso {adminModal.mode === 'edit' && <small>(Opcional)</small>}</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required={adminModal.mode === 'add'} // Obrigatório apenas se for novo
                  value={adminFormData.password} 
                  onChange={handleAdminFormChange} 
                  placeholder={adminModal.mode === 'add' ? "Digite a senha" : "Deixe em branco para não alterar"} 
                  style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#f97316', display: 'flex' }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.formActions} style={{ marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={() => setAdminModal({ isOpen: false, mode: 'add' })}>Cancelar</Button>
            <Button type="submit" disabled={adminSubmitting} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
              {adminSubmitting ? 'A Salvar...' : 'Salvar Administrador'}
            </Button>
          </div>
        </form>
      </Modal>

    </ContentWrapper>
  );
};

export default EditOngPage;