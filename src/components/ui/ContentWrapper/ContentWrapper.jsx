import React from 'react';
import styles from './ContentWrapper.module.css';

const ContentWrapper = ({ title, children }) => {
  return (
    <div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.wrapper}>
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;