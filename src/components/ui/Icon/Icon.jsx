import React from 'react';

// =====================================================================
// CORREÇÃO: O valor padrão 'icon' foi removido da prop className.
// Agora, se nenhuma classe for passada, a string será vazia, o que é seguro.
// =====================================================================
const Icon = ({ path, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className} // Aplica a classe recebida (ex: styles.menuIcon )
  >
    <path d={path} />
  </svg>
);

export default Icon;
