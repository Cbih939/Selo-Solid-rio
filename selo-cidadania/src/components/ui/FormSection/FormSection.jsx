import React from 'react';
import styles from './FormSection.module.css';

const FormSection = ({ number, title, children }) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{number}. {title}</h2>
      <div className={styles.grid}>
        {children}
      </div>
    </div>
  );
};

export default FormSection;