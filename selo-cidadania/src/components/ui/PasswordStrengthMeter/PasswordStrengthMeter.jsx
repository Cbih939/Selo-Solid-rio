import React from 'react';
import styles from './PasswordStrengthMeter.module.css';

const ValidationItem = ({ isValid, text }) => (
  <li className={isValid ? styles.valid : styles.invalid}>
    {text}
  </li>
);

const PasswordStrengthMeter = ({ validations }) => {
  return (
    <ul className={styles.validationList}>
      <ValidationItem isValid={validations.hasLower} text="Pelo menos 1 letra minúscula" />
      <ValidationItem isValid={validations.hasUpper} text="Pelo menos 1 letra maiúscula" />
      <ValidationItem isValid={validations.hasNumber} text="Pelo menos 1 número" />
      <ValidationItem isValid={validations.hasSpecial} text="Pelo menos 1 caracter especial" />
      <ValidationItem isValid={validations.hasSixChars} text="Pelo menos 6 caracteres" />
      <ValidationItem isValid={validations.hasEightChars} text="Máximo de 8 caracteres" />
    </ul>
  );
};

export default PasswordStrengthMeter;