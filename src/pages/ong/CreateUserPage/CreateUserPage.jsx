// src/pages/ong/CreateUserPage/CreateUserPage.jsx

import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import FormSection from '../../../components/ui/FormSection/FormSection';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './CreateUserPage.module.css';

const CreateUserPage = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
  });
  
  const [dependents, setDependents] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDependentChange = (index, event) => {
    const newDependents = [...dependents];
    newDependents[index][event.target.name] = event.target.value;
    setDependents(newDependents);
  };

  const addDependent = () => {
    if (dependents.length < 20) {
      // ++ CORREÇÃO: Adicionado 'birth_date' ao adicionar um novo dependente ++
      setDependents([...dependents, { fullName: '', cpf: '', phone: '', relationship: '', birth_date: '' }]);
    } else {
      alert('O limite de 20 dependentes foi atingido.');
    }
  };

  const removeDependent = (index) => {
    const newDependents = [...dependents];
    newDependents.splice(index, 1);
    setDependents(newDependents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const dataToSend = {
        ...formData,
        ong_id: user.ong_id,
        dependents: dependents.filter(dep => dep.fullName && dep.relationship),
      };

      await api.post('/users', dataToSend);
      alert(`Beneficiário "${formData.name}" criado com sucesso!`);
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '' });
      setDependents([]);

    } catch (error) {
      if (error.response && error.response.status === 409) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('CPF')) setErrors({ cpf: errorMessage });
        if (errorMessage.includes('email')) setErrors({ email: errorMessage });
      } else {
        console.error("Erro ao criar beneficiário:", error);
        alert("Ocorreu um erro. Verifique o console.");
      }
    }
  };

  return (
    <ContentWrapper title="Cadastrar Novo Beneficiário">
      <p style={{marginTop: '-1.5rem', marginBottom: '2rem', color: '#6b7280'}}>Este Beneficiário será atrelado à sua ONG.</p>
      <form onSubmit={handleSubmit}>
        <FormSection number="1" title="Dados do Beneficiário">
            <InputField label="Nome Completo do Beneficiário" name="name" value={formData.name} onChange={handleChange} required />
            <InputField label="E-mail" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <InputField label="CPF" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} error={errors.cpf} mask="cpf" />
            <InputField label="Telefone / WhatsApp" name="phone" type="tel" value={formData.phone} onChange={handleChange} mask="phone" />
            <InputField label="Senha Provisória" name="password" type="password" value={formData.password} onChange={handleChange} required />
        </FormSection>

        <FormSection number="2" title="Dependentes (Opcional)">
          {dependents.map((dependent, index) => (
            <div key={index} className={styles.dependentRow}>
              <InputField
                label={`Nome Completo do Dependente ${index + 1}`}
                name="fullName"
                value={dependent.fullName}
                onChange={(e) => handleDependentChange(index, e)}
                required
              />
              {/* ++ INÍCIO DA CORREÇÃO: Adicionado campo de Data de Nascimento ++ */}
              <InputField
                label="Data de Nascimento"
                name="birth_date"
                type="date"
                value={dependent.birth_date}
                onChange={(e) => handleDependentChange(index, e)}
              />
              {/* ++ FIM DA CORREÇÃO ++ */}
              <InputField
                label="CPF do Dependente"
                name="cpf"
                value={dependent.cpf}
                onChange={(e) => handleDependentChange(index, e)}
                mask="cpf"
              />
              <InputField
                label="Telefone do Dependente"
                name="phone"
                value={dependent.phone}
                onChange={(e) => handleDependentChange(index, e)}
                mask="phone"
              />
              <InputField
                label="Grau de Parentesco"
                name="relationship"
                placeholder="Ex: Filho(a), Cônjuge, Pai/Mãe"
                value={dependent.relationship}
                onChange={(e) => handleDependentChange(index, e)}
                required
              />
              <button type="button" onClick={() => removeDependent(index)} className={styles.removeButton}>
                Remover
              </button>
            </div>
          ))}
          {dependents.length < 20 && (
            <Button type="button" onClick={addDependent} variant="secondary">
              + Adicionar Dependente
            </Button>
          )}
        </FormSection>

        <div style={{maxWidth: '300px', marginTop: '2rem'}}>
            <Button type="submit">Cadastrar Beneficiário</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateUserPage;
