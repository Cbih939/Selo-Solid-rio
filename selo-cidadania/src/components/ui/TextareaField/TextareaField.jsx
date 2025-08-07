import React from 'react';
import styles from './TextareaField.module.css';

const TextareaField = ({ label, name, placeholder, rows = 4 }) => {
  return (
    <div className={styles.group}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        rows={rows}
        className={styles.textarea}
      />
    </div>
  );
};

export default TextareaField;