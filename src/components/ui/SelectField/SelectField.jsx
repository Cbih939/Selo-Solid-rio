import React from 'react';
import styles from './SelectField.module.css';

// Adicionadas as props 'value' e 'onChange' para o componente ser controlado
const SelectField = ({ label, name, value, onChange, children }) => {
  return (
    <div className={styles.group}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <select 
        id={name} 
        name={name} 
        className={styles.select}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
};

export default SelectField;