// Arquivo: InputField.jsx (VERSÃO CORRIGIDA E ROBUSTA)

import React, { useState } from 'react';
import styles from './InputField.module.css';
import { maskCPF, maskCNPJ, maskPhone } from '../../../utils/masks';
import { validatePassword } from '../../../utils/validators';
import Icon from '../Icon/Icon';
// ### CORREÇÃO 1: Importação do ICONS ###
// O componente Icon espera uma 'name', não um 'path'. A importação direta não é necessária aqui.
// import { ICONS } from '../../../assets/icons/ICONS'; 
import PasswordStrengthMeter from '../PasswordStrengthMeter/PasswordStrengthMeter';

const InputField = ({ label, type = 'text', name, placeholder, value, onChange, error, readOnly = false, mask }) => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isPasswordField = type === 'password';
  // Se for um campo de senha, o tipo real (text/password) é controlado pelo estado.
  const inputType = isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type;
  
  const passwordValidations = isPasswordField ? validatePassword(value || '') : null;

  const handleInputChange = (e) => {
    // ### CORREÇÃO 2: Lógica do onChange simplificada ###
    // A função onChange passada como prop deve ser chamada com o evento modificado.
    
    const originalValue = e.target.value;
    let maskedValue = originalValue;

    if (mask === 'cpf') maskedValue = maskCPF(originalValue);
    else if (mask === 'cnpj') maskedValue = maskCNPJ(originalValue);
    else if (mask === 'phone') maskedValue = maskPhone(originalValue);
    // A máscara de 'tel' não é necessária, pois o tipo 'tel' já sugere um teclado numérico em dispositivos móveis.

    // Modifica o valor do evento e passa o evento inteiro para a função onChange.
    // Isso mantém a compatibilidade com funções como `(e) => setSearchTerm(e.target.value)`.
    e.target.value = maskedValue;
    onChange(e); // Chama a função original com o evento modificado.
    
    if (validationError) {
      setValidationError('');
    }
  };

  const handleBlur = (e) => {
    const unmaskedValue = e.target.value.replace(/\D/g, '');
    let expectedLength = 0;
    let errorMessage = '';

    if (mask === 'cpf') {
      expectedLength = 11;
      errorMessage = 'O CPF deve conter 11 dígitos.';
    } else if (mask === 'cnpj') {
      expectedLength = 14;
      errorMessage = 'O CNPJ deve conter 14 dígitos.';
    } else if (mask === 'phone') {
      if (unmaskedValue.length > 0 && unmaskedValue.length < 10) {
        setValidationError('O telefone deve conter pelo menos 10 dígitos.');
        return;
      }
    }

    if (expectedLength > 0 && unmaskedValue.length > 0 && unmaskedValue.length < expectedLength) {
      setValidationError(errorMessage);
    } else {
      setValidationError('');
    }
  };

  const togglePasswordVisibility = () => setPasswordVisible(!isPasswordVisible);

  return (
    <div className={styles.group}>
      {/* Adicionado um if para não renderizar a label se ela não for passada */}
      {label && <label htmlFor={name} className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          type={inputType}
          id={name}
          name={name}
          placeholder={placeholder}
          className={`${styles.input} ${error || validationError ? styles.errorInput : ''}`}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          readOnly={readOnly}
        />
        {isPasswordField && (
          <button type="button" className={styles.toggleButton} onClick={togglePasswordVisibility}>
            {/* ### CORREÇÃO 3: Uso correto do componente Icon ### */}
            {/* Passa o 'name' do ícone, que o componente Icon usará para encontrar o path. */}
            <Icon name={isPasswordVisible ? 'eyeOff' : 'eye'} size={20} />
          </button>
        )}
      </div>
      {(error || validationError) && <p className={styles.errorMessage}>{error || validationError}</p>}
      
      {isPasswordField && value && (
        <PasswordStrengthMeter validations={passwordValidations} />
      )}
    </div>
  );
};

export default InputField;
