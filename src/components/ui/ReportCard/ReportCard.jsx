import React from 'react';
import styles from './ReportCard.module.css';

const ReportCard = ({ title, value, icon }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
};

export default ReportCard;