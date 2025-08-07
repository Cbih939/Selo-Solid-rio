import React, { useState } from 'react';
import styles from './InputField.module.css';
import { maskCPF, maskCNPJ, maskPhone } from '../../../utils/masks';
import { validatePassword } from '../../../utils/validators';
import Icon from '../Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS';
import PasswordStrengthMeter from '../PasswordStrengthMeter/PasswordStrengthMeter';

const InputField = ({ label, type = 'text', name, placeholder, value, onChange, error, readOnly = false, mask }) => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isPasswordField = type === 'password';
  const inputType = isPasswordVisible ? 'text' : 'password';
  
  const passwordValidations = isPasswordField ? validatePassword(value || '') : null;

  const handleInputChange = (e) => {
    let { value } = e.target;
    let maskedValue = value;

    if (mask === 'cpf') maskedValue = maskCPF(value);
    else if (mask === 'cnpj') maskedValue = maskCNPJ(value);
    else if (mask === 'phone') maskedValue = maskPhone(value);
    else if (type === 'tel') maskedValue = value.replace(/[^0-9]/g, '');

    onChange({ ...e, target: { ...e.target, name, value: maskedValue } });
    
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
      <label htmlFor={name} className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          type={isPasswordField ? inputType : type}
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
            <Icon path={isPasswordVisible ? ICONS.eyeOff : ICONS.eye} />
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