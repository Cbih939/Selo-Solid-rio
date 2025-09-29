import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import SelectField from '../../../components/ui/SelectField/SelectField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './CreateUserAdminPage.module.css'; // Supondo que você crie um CSS

const CreateUserAdminPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    ong_id: '', // ID da ONG selecionada
  });
  
  // CORREÇÃO: Inicialize o estado de ongs como uma lista vazia `[]`
  const [ongs, setOngs] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Efeito para buscar a lista de ONGs quando a página carrega
  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        // Garante que estamos a guardar uma lista no estado
        if (Array.isArray(response.data)) {
          setOngs(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar OSCs:", error);
        setErrors(prev => ({ ...prev, ongs: 'Não foi possível carregar a lista de OSCs.' }));
      } finally {
        setLoading(false);
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
      // A rota para criar um usuário é /api/users
      await api.post('/users', formData);
      alert(`Beneficiário "${formData.name}" criado com sucesso!`);
      // Limpa o formulário após o sucesso
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '', ong_id: '' });
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('CPF')) setErrors({ cpf: errorMessage });
        if (errorMessage.includes('email')) setErrors({ email: errorMessage });
      } else {
        console.error("Erro ao criar beneficiário:", error);
        alert("Ocorreu um erro. Verifique a consola.");
      }
    }
  };

  if (loading) {
    return <ContentWrapper title="Cadastrar Novo Beneficiário"><p>A carregar...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Cadastrar Novo Beneficiário (Admin)">
      <p className={styles.subtitle}>Preencha os dados abaixo para criar um novo beneficiário.</p>
      <form onSubmit={handleSubmit}>
        <InputField 
          label="Nome Completo do Beneficiário" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          required
        />
        <InputField 
          label="E-mail" 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          error={errors.email}
          required
        />
        <InputField 
          label="CPF" 
          name="cpf" 
          placeholder="000.000.000-00" 
          value={formData.cpf} 
          onChange={handleChange} 
          error={errors.cpf}
          mask="cpf"
        />
        <InputField 
          label="Telefone / WhatsApp" 
          name="phone" 
          type="tel" 
          value={formData.phone} 
          onChange={handleChange}
          mask="phone"
        />
        <InputField 
          label="Senha Provisória" 
          name="password" 
          type="password" 
          value={formData.password} 
          onChange={handleChange}
          required
        />
        
        {/* Dropdown para selecionar a ONG */}
        <SelectField
          label="Atrelar à OSC (Opcional)"
          name="ong_id"
          value={formData.ong_id}
          onChange={handleChange}
          error={errors.ongs}
        >
          <option value="">Nenhuma</option>
          {/* O .map() agora é seguro porque 'ongs' é sempre uma lista */}
          {ongs.map(ong => (
            <option key={ong.id} value={ong.id}>
              {ong.fantasy_name}
            </option>
          ))}
        </SelectField>

        <div className={styles.submitButton}>
            <Button type="submit">Cadastrar Beneficiário</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateUserAdminPage;
