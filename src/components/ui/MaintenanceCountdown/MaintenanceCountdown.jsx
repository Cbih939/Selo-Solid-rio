import React, { useState, useEffect } from 'react';
import styles from './MaintenanceCountdown.module.css';

const MaintenanceCountdown = ({ startTime, estimatedReturn }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.floor((start - now) / 1000); // Diferença em segundos

      if (diff > 0 && diff <= 600) { // Exibe apenas nos últimos 10 minutos (600s)
        setTimeLeft(diff);
      } else {
        setTimeLeft(null);
      }
    };

    const timer = setInterval(calculateTime, 1000);
    calculateTime();
    return () => clearInterval(timer);
  }, [startTime]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>⚠️</span>
      <p>
        <strong>Atenção:</strong> O sistema entrará em manutenção em {minutes}:{seconds < 10 ? `0${seconds}` : seconds} minutos. 
        {estimatedReturn && ` Previsão de volta: ${new Date(estimatedReturn).toLocaleTimeString()}.`}
      </p>
    </div>
  );
};

export default MaintenanceCountdown;