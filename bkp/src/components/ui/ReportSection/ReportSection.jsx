import React from 'react';
import styles from './ReportSection.module.css';

const ReportSection = ({ title, children }) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default ReportSection;
