import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

// A página agora recebe o 'user' logado como propriedade
const CreateUserPage = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      // CORREÇÃO: Adiciona o 'ong_id' do utilizador logado aos dados a serem enviados
      const dataToSend = {
        ...formData,
        ong_id: user.ong_id,
      };

      const response = await api.post('/users', dataToSend);
      alert(`Utilizador "${response.data.name}" criado com sucesso!`);
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '' });
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('CPF')) {
          setErrors({ cpf: errorMessage });
        }
        if (errorMessage.includes('email')) {
          setErrors({ email: errorMessage });
        }
      } else {
        console.error("Erro ao criar utilizador:", error);
        alert("Ocorreu um erro. Verifique a consola.");
      }
    }
  };

  return (
    <ContentWrapper title="Cadastrar Novo Usuário">
      <p style={{marginTop: '-1.5rem', marginBottom: '2rem', color: '#6b7280'}}>Este usuário será atrelado à sua ONG.</p>
      <form onSubmit={handleSubmit}>
        <InputField 
          label="Nome Completo do Usuário" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
        />
        <InputField 
          label="Email" 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          error={errors.email} 
        />
        <InputField 
          label="CPF" 
          name="cpf" 
          placeholder="000.000.000-00" 
          value={formData.cpf} 
          onChange={handleChange} 
          error={errors.cpf} 
        />
        <InputField 
          label="Telefone / WhatsApp" 
          name="phone" 
          type="tel" 
          value={formData.phone} 
          onChange={handleChange} 
        />
        <InputField 
          label="Senha Provisória" 
          name="password" 
          type="password" 
          value={formData.password} 
          onChange={handleChange} 
        />
        <div style={{maxWidth: '300px'}}>
            <Button type="submit">Cadastrar Usuário</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateUserPage;