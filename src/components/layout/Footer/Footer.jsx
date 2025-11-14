// Arquivo: components/layout/Footer/Footer.jsx (CORRIGIDO)

import React from 'react';
import styles from './Footer.module.css';
import packageJson from "../../../../package.json";

const { version } = packageJson;

// 1. Receba o "onNavigate" como uma propriedade (prop)
const Footer = ({ onNavigate }) => {

  // 2. Defina a função "handleLinkClick" que estava em falta
  const handleLinkClick = (e, page) => {
    e.preventDefault(); // Impede o navegador de seguir o link "#"
    
    // Verifica se a função onNavigate foi realmente passada
    if (onNavigate) {
      onNavigate(page); // Chama a função de navegação do App.jsx
    } else {
      console.error("Footer: A propriedade onNavigate não foi recebida.");
    }
  };

  return (
    <footer className={styles.footer}>
      <p>
        Copyright 2025. Selo Cidadania. Todos os direitos reservados.
      </p>
      <p>
        Desenvolvido por <a href="https://baygroups.com.br" target="_blank" rel="noopener noreferrer">Agência Bay Groups</a>
      </p>
      <p className={styles.version}>
        Versão: {version}
      </p>
      <nav className={styles.links}>
        {/* Agora esta chamada vai funcionar */}
        <a href="#" onClick={(e) => handleLinkClick(e, 'privacy_policy')}>
          Política de Privacidade
        </a>
        <span className={styles.separator}>|</span>
        <a href="#" onClick={(e) => handleLinkClick(e, 'terms_of_use')}>
          Termos de Uso
        </a>
      </nav>
    </footer>
  );
};

export default Footer;