import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import SelectField from '../../../components/ui/SelectField/SelectField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateUserAdminPage = () => {
  const [ongs, setOngs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    ong_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(response.data);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
      }
    };
    fetchOngs();
  }, []);

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
      const response = await api.post('/users', formData);
      alert(`Utilizador "${response.data.name}" criado com sucesso!`);
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '', ong_id: '' });
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
    <ContentWrapper title="Cadastrar Novo Usuário (Admin)">
      <form onSubmit={handleSubmit}>
        <InputField label="Nome Completo do Usuário" name="name" value={formData.name} onChange={handleChange} />
        <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
        <InputField label="CPF" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} error={errors.cpf} />
        <InputField label="Telefone / WhatsApp" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
        <InputField label="Senha Provisória" name="password" type="password" value={formData.password} onChange={handleChange} />
        
        <SelectField label="Atrelar à ONG (Opcional)" name="ong_id" value={formData.ong_id} onChange={handleChange}>
          <option value="">Nenhuma</option>
          {ongs.map(ong => (
            <option key={ong.id} value={ong.id}>
              {ong.fantasy_name}
            </option>
          ))}
        </SelectField>

        <div style={{maxWidth: '300px'}}>
            <Button type="submit">Cadastrar Usuário</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateUserAdminPage;
