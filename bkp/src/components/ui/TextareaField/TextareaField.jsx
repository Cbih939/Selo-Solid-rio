import React from 'react';
import styles from './TextareaField.module.css'; // Crie ou ajuste o seu CSS module

const TextareaField = ({ label, name, value, onChange, placeholder, error }) => {
  return (
    <div className={styles.textareaGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}         // <-- ESSENCIAL: Recebe o valor do estado
        onChange={onChange}     // <-- ESSENCIAL: Chama a função para atualizar o estado
        placeholder={placeholder}
        className={`${styles.textarea} ${error ? styles.errorInput : ''}`} // Aplica estilo de erro
      />
      {/* Exibe a mensagem de erro se ela existir */}
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default TextareaField;
