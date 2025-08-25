import React from 'react';
import styles from './DashboardCard.module.css';
import Icon from '../Icon/Icon';

const DashboardCard = ({ title, icon, onClick }) => {
  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.iconWrapper}>
        <Icon path={icon} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
    </button>
  );
};

export default DashboardCard;