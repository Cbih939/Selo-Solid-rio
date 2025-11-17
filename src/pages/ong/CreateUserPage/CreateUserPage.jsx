// Arquivo: src/pages/ong/CreateUserPage/CreateUserPage.jsx

import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FormSection from '../../../components/ui/FormSection/FormSection';
import api from '../../../api/api';
import { maskCPF, maskPhone, validateCPF, validateEmail } from '../../../utils/validators';
import styles from './CreateUserPage.module.css';

const CreateUserPage = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    dependents: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // --- Manipulação de Dependentes ---
  const addDependent = () => {
    setFormData({
      ...formData,
      dependents: [...formData.dependents, { fullName: '', cpf: '', relationship: '', birth_date: '', phone: '' }]
    });
  };

  const removeDependent = (index) => {
    const newDependents = formData.dependents.filter((_, i) => i !== index);
    setFormData({ ...formData, dependents: newDependents });
  };

  const handleDependentChange = (index, field, value) => {
    const newDependents = [...formData.dependents];
    
    if (field === 'cpf') value = maskCPF(value);
    if (field === 'phone') value = maskPhone(value);

    newDependents[index][field] = value;
    setFormData({ ...formData, dependents: newDependents });
  };

  // --- Manipulação do Titular ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = maskCPF(value);
    if (name === 'phone') formattedValue = maskPhone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // --- Validação ---
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "O nome completo é obrigatório.";
    else if (formData.name.split(' ').length < 2) newErrors.name = "Digite o nome e o sobrenome.";

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Formato de e-mail inválido.";
    }

    if (!formData.cpf) newErrors.cpf = "O CPF é obrigatório.";
    else if (!validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido.";

    if (!formData.password) newErrors.password = "A senha é obrigatória.";
    else if (formData.password.length < 6) newErrors.password = "A senha deve ter no mínimo 6 caracteres.";

    // Validação flexível para telefone (considerando com ou sem máscara completa)
    if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = "Telefone inválido.";
    }

    formData.dependents.forEach((dep, index) => {
      if (!dep.fullName) newErrors[`dep_name_${index}`] = "Nome do dependente é obrigatório.";
      if (!dep.relationship) newErrors[`dep_rel_${index}`] = "Parentesco é obrigatório.";
      if (!dep.birth_date) newErrors[`dep_date_${index}`] = "Data de nascimento é obrigatória.";
      if (dep.cpf && !validateCPF(dep.cpf)) newErrors[`dep_cpf_${index}`] = "CPF inválido.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert("Por favor, corrija os erros no formulário antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/users', formData);
      alert("Beneficiário cadastrado com sucesso!");
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '', dependents: [] });
      setErrors({});
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      const msg = error.response?.data?.message || "Erro ao cadastrar beneficiário.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper title="Cadastrar Novo Beneficiário">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        
        {/* DADOS DO TITULAR */}
        <FormSection number="1" title="Dados do Titular">
          {/* CAMPO NOME */}
          <div>
            <InputField 
              label="Nome Completo *" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Nome e Sobrenome"
              error={errors.name}
            />
            <span className={styles.inputHint}>Exemplo: Maria da Silva (Preencha nome e sobrenome)</span>
          </div>
          
          <div className={styles.row}>
            {/* CAMPO CPF */}
            <div>
              <InputField 
                label="CPF *" 
                name="cpf" 
                value={formData.cpf} 
                onChange={handleChange} 
                placeholder="000.000.000-00"
                maxLength="14"
                error={errors.cpf}
              />
              <span className={styles.inputHint}>Apenas números (11 dígitos)</span>
            </div>

            {/* CAMPO TELEFONE */}
            <div>
              <InputField 
                label="Telefone/WhatsApp" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="(11) 99999-9999"
                maxLength="15"
                error={errors.phone}
              />
              <span className={styles.inputHint}>Ex: 11987654321 (DDD + Número sem espaços)</span>
            </div>
          </div>

          <div className={styles.row}>
            {/* CAMPO EMAIL */}
            <div>
              <InputField 
                label="E-mail" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="exemplo@email.com"
                error={errors.email}
              />
              <span className={styles.inputHint}>Ex: joao@gmail.com</span>
            </div>

            {/* CAMPO SENHA */}
            <div>
              <InputField 
                label="Senha de Acesso *" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Mínimo 6 caracteres"
                error={errors.password}
              />
              <span className={styles.inputHint}>Crie uma senha segura com letras e números</span>
            </div>
          </div>
        </FormSection>

        {/* DADOS DOS DEPENDENTES */}
        <FormSection number="2" title="Dependentes (Filhos/Familiares)">
          {formData.dependents.map((dep, index) => (
            <div key={index} className={styles.dependentCard}>
              <div className={styles.dependentHeader}>
                <h4>Dependente #{index + 1}</h4>
                <button type="button" onClick={() => removeDependent(index)} className={styles.removeBtn}>
                  Remover
                </button>
              </div>
              
              <div>
                <InputField 
                  label="Nome Completo *" 
                  value={dep.fullName} 
                  onChange={(e) => handleDependentChange(index, 'fullName', e.target.value)}
                  placeholder="Nome do Dependente"
                  error={errors[`dep_name_${index}`]}
                />
                <span className={styles.inputHint}>Ex: João da Silva Jr.</span>
              </div>
              
              <div className={styles.row}>
                <InputField 
                  label="Parentesco *" 
                  value={dep.relationship} 
                  onChange={(e) => handleDependentChange(index, 'relationship', e.target.value)}
                  placeholder="Ex: Filho(a)"
                  error={errors[`dep_rel_${index}`]}
                />
                <div>
                    <InputField 
                    label="Data de Nascimento *" 
                    type="date" 
                    value={dep.birth_date} 
                    onChange={(e) => handleDependentChange(index, 'birth_date', e.target.value)}
                    error={errors[`dep_date_${index}`]}
                    />
                     {/* Não precisa de hint aqui pois o seletor de data já ajuda */}
                </div>
              </div>

              <div className={styles.row}>
                <div>
                  <InputField 
                    label="CPF (Opcional)" 
                    value={dep.cpf} 
                    onChange={(e) => handleDependentChange(index, 'cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength="14"
                    error={errors[`dep_cpf_${index}`]}
                  />
                  <span className={styles.inputHint}>Apenas números</span>
                </div>
              </div>
            </div>
          ))}
          
          <Button type="button" variant="secondary" onClick={addDependent} className={styles.addBtn}>
            + Adicionar Dependente
          </Button>
        </FormSection>

        <div className={styles.formActions}>
          <Button type="submit" disabled={loading}>
            {loading ? 'A cadastrar...' : 'Realizar Cadastro'}
          </Button>
        </div>

      </form>
    </ContentWrapper>
  );
};

export default CreateUserPage;