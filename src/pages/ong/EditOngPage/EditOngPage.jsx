// Arquivo: pages/ong/EditOngPage/EditOngPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import FormSection from '../../../components/ui/FormSection/FormSection';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './EditOngPage.module.css';

import { maskCPF, maskPhone } from '../../../utils/validators';

const EditOngPage = ({ user }) => {
  const [formData, setFormData] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Estados para os novos ficheiros
  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);

  // Estados para Modal de Novo Admin
  const [isAddAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', cpf: '', phone: '', password: '' });

  // Busca dados iniciais
  useEffect(() => {
    if (!user || !user.ong_id) return;
    fetchOngData();
    fetchAdmins();
  }, [user]);

  const fetchOngData = async () => {
    try {
      const response = await api.get(`/ongs/${user.ong_id}`);
      setFormData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.get(`/ongs/${user.ong_id}/admins`);
      setAdmins(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manipulador para campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Aplica máscara se for WhatsApp
    let formattedValue = value;
    if (name === 'whatsapp') formattedValue = maskPhone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // Manipulador para ficheiros
  const handleFileChange = (file, type) => {
    if (type === 'logo') setLogoFile(file);
    if (type === 'ata') setAtaFile(file);
    if (type === 'statute') setStatuteFile(file);
  };

  // Manipulador para submeter o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    const dataToSubmit = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && typeof value !== 'object') {
        dataToSubmit.append(key, value);
      }
    });

    if (logoFile) dataToSubmit.append('logo_file', logoFile);
    if (ataFile) dataToSubmit.append('ata_file', ataFile);
    if (statuteFile) dataToSubmit.append('statute_file', statuteFile);

    try {
      await api.put(`/ongs/${user.ong_id}`, dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Informações da OSC atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar ONG:", err);
      alert("Ocorreu um erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNÇÕES PARA GESTÃO DE ADMINS ---
  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cpf') formattedValue = maskCPF(value);
    if (name === 'phone') formattedValue = maskPhone(value);
    setNewAdmin(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (admins.length >= 5) {
      alert("Limite máximo de 5 administradores atingido.");
      return;
    }
    try {
      await api.post(`/ongs/${user.ong_id}/admins`, newAdmin);
      alert("Novo administrador adicionado!");
      setAddAdminModalOpen(false);
      setNewAdmin({ name: '', email: '', cpf: '', phone: '', password: '' });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao adicionar administrador.");
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (!window.confirm("Tem certeza que deseja remover este administrador?")) return;
    try {
      await api.delete(`/ongs/${user.ong_id}/admins/${adminId}`);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao remover.");
    }
  };

  if (loading) {
    return <ContentWrapper title="Editar Minha OSC"><p>A carregar informações...</p></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Erro"><p>{error}</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Editar Minha OSC">
      {formData && (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <FormSection number="1" title="Informações Principais">
            <InputField label="Nome Fantasia" name="fantasy_name" value={formData.fantasy_name || ''} onChange={handleChange} required />
            <InputField label="Razão Social" name="corporate_name" value={formData.corporate_name || ''} onChange={handleChange} required />
            <InputField label="CNPJ" name="cnpj" value={formData.cnpj || ''} mask="cnpj" readOnly disabled />
            <InputField label="Data de Fundação" name="foundation_date" type="date" value={formData.foundation_date?.split('T')[0] || ''} onChange={handleChange} />
          </FormSection>

          <FormSection number="2" title="Contato e Endereço">
                <InputField label="E-mail da ONG" name="contact_email" type="email" value={formData.contact_email || ''} onChange={handleChange} required />
                <InputField label="Telefone Fixo" name="phone" value={formData.phone || ''} onChange={handleChange} />
                <InputField label="Endereço" name="address" value={formData.address || ''} onChange={handleChange} />
                <InputField label="Cidade" name="city" value={formData.city || ''} onChange={handleChange} />
                <InputField label="Estado" name="state" value={formData.state || ''} onChange={handleChange} />
          </FormSection>

          {/* === NOVA SEÇÃO: ATENDIMENTO E REDES SOCIAIS === */}
          <FormSection number="3" title="Atendimento e Redes Sociais">
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
                  Facilite a comunicação. Estas informações ficarão visíveis para as famílias vinculadas à sua OSC.
                </p>
                <InputField label="WhatsApp de Atendimento" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} placeholder="(11) 99999-9999" />
                <InputField label="Link do Instagram" name="instagram" value={formData.instagram || ''} onChange={handleChange} placeholder="https://instagram.com/sua_osc" />
                <InputField label="Link do Facebook" name="facebook" value={formData.facebook || ''} onChange={handleChange} placeholder="https://facebook.com/sua_osc" />
                <InputField label="Website Oficial" name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://www.sua-osc.org.br" />
          </FormSection>

          {/* === NOVA SEÇÃO: GOOGLE DRIVE === */}
          <FormSection number="4" title="Armazenamento em Nuvem (Google Drive)">
                <div style={{ backgroundColor: '#fffbeb', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f59e0b', marginBottom: '15px' }}>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    <strong>Aviso de Limpeza:</strong> Para manter a plataforma rápida, as fotos das provas sociais analisadas são limpas do nosso servidor a cada 60 dias. Cole abaixo o link partilhado de uma pasta do seu Google Drive para garantir o backup do seu histórico.
                  </p>
                </div>
                <InputField 
                    label="Link da Pasta do Google Drive" 
                    name="drive_link" 
                    value={formData.drive_link || ''} 
                    onChange={handleChange} 
                    placeholder="https://drive.google.com/drive/folders/..." 
                />
          </FormSection>

          <FormSection number="5" title="Documentos">
                {formData.logo_url && <p>Logo Atual: <a href={formData.logo_url} target="_blank" rel="noreferrer">Ver</a></p>}
                <FileUpload label="Alterar Logo" onFileSelect={(f) => handleFileChange(f, 'logo')} accept="image/*" />
                <FileUpload label="Alterar Ata" onFileSelect={(f) => handleFileChange(f, 'ata')} accept="application/pdf" />
                <FileUpload label="Alterar Estatuto" onFileSelect={(f) => handleFileChange(f, 'statute')} accept="application/pdf" />
          </FormSection>

          <FormSection number="6" title="Equipe de Gestão (Administradores)">
                <div className={styles.adminHeader}>
                    <p>Você pode ter até 5 pessoas gerenciando esta ONG. <strong>Atual: {admins.length}/5</strong></p>
                    {admins.length < 5 && (
                        <Button type="button" onClick={() => setAddAdminModalOpen(true)}>+ Adicionar Admin</Button>
                    )}
                </div>
                
                <div className={styles.adminList}>
                    {admins.map(admin => (
                        <div key={admin.id} className={styles.adminCard}>
                            <div className={styles.adminInfo}>
                                <strong>{admin.name}</strong>
                                <span>{admin.email}</span>
                                <span className={styles.cpf}>{admin.cpf}</span>
                            </div>
                            {admin.id !== user.id && ( 
                                <button type="button" className={styles.deleteBtn} onClick={() => handleRemoveAdmin(admin.id)}>
                                    Remover
                                </button>
                            )}
                            {admin.id === user.id && <span className={styles.youTag}>(Você)</span>}
                        </div>
                    ))}
                </div>
          </FormSection>

          <div className={styles.actions}>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Alterações da OSC'}</Button>
          </div>
        </form>
      )}

      {/* MODAL PARA ADICIONAR ADMIN */}
      <Modal isOpen={isAddAdminModalOpen} onClose={() => setAddAdminModalOpen(false)} title="Novo Administrador">
        <form onSubmit={handleAddAdmin}>
            <div className={styles.modalContent}>
                <InputField label="Nome Completo" name="name" value={newAdmin.name} onChange={handleNewAdminChange} required />
                <InputField label="E-mail de Login" name="email" type="email" value={newAdmin.email} onChange={handleNewAdminChange} required />
                <InputField label="CPF" name="cpf" value={newAdmin.cpf} onChange={handleNewAdminChange} required />
                <InputField label="Telefone" name="phone" value={newAdmin.phone} onChange={handleNewAdminChange} required />
                <InputField label="Senha de Acesso" name="password" type="password" value={newAdmin.password} onChange={handleNewAdminChange} required />
                
                <div className={styles.modalActions}>
                    <Button type="button" variant="secondary" onClick={() => setAddAdminModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Cadastrar Admin</Button>
                </div>
            </div>
        </form>
      </Modal>

    </ContentWrapper>
  );
};

export default EditOngPage;