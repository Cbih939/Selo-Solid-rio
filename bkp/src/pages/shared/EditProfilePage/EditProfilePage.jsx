import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const EditProfilePage = ({ user, onNavigate }) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const response = await api.get(`/users/${user.id}/profile`);
          setFormData(response.data);
        } catch (error) {
          console.error("Erro ao buscar perfil para edição:", error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOngChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      ong_details: {
        ...prev.ong_details,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${user.id}/profile`, formData);
      alert("Perfil atualizado com sucesso!");
      onNavigate('profile');
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Ocorreu um erro ao atualizar o perfil.");
    }
  };

  if (!formData) {
    return <ContentWrapper title="Editar Perfil"><p>A carregar dados...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Editar Perfil">
      <form onSubmit={handleSubmit}>
        {/* Campos comuns a todos os perfis */}
        <InputField label="Nome Completo" name="name" value={formData.name} onChange={handleChange} />
        <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
        <InputField label="Telefone" name="phone" value={formData.phone || ''} onChange={handleChange} />

        {/* Campos específicos para o perfil ONG */}
        {formData.role === 'ong' && formData.ong_details && (
          <>
            <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0'}} />
            <InputField label="Nome Fantasia da ONG" name="fantasy_name" value={formData.ong_details.fantasy_name} onChange={handleOngChange} />
            <InputField label="CNPJ (não pode ser alterado)" name="cnpj" value={formData.ong_details.cnpj} readOnly />
            <InputField label="Email de Contato da ONG" name="contact_email" value={formData.ong_details.contact_email} onChange={handleOngChange} />
            <InputField label="Website da ONG" name="website" value={formData.ong_details.website || ''} onChange={handleOngChange} />
          </>
        )}

        <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0'}} />
        <InputField label="Nova Senha" type="password" name="password" placeholder="Deixe em branco para não alterar" />
        
        <div style={{display: 'flex', gap: '1rem', maxWidth: '400px', marginTop: '1rem'}}>
            <Button type="button" variant="secondary" onClick={() => onNavigate('profile')}>Cancelar</Button>
            <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default EditProfilePage;
