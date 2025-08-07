import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import { validatePassword } from '../../../utils/validators'; // Importa a validação

const CreateAdminPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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

    // Valida a senha antes de enviar
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setErrors({ password: "A senha não cumpre todos os requisitos." });
      return; // Impede o envio do formulário
    }

    try {
      await api.post('/admins', formData);
      alert(`Administrador "${formData.name}" criado com sucesso!`);
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setErrors({ email: err.response.data.message });
      } else {
        alert("Ocorreu um erro.");
      }
    }
  };

  return (
    <ContentWrapper title="Cadastrar Admin Nível 1">
      <form onSubmit={handleSubmit}>
        <InputField label="Nome Completo" name="name" value={formData.name} onChange={handleChange} />
        <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
        <InputField label="Senha Provisória" type="password" name="password" value={formData.password} onChange={handleChange} error={errors.password} />
        <div style={{maxWidth: '300px', marginTop: '1rem'}}>
          <Button type="submit">Cadastrar Administrador</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateAdminPage;