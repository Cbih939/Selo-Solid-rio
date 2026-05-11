// Arquivo: src/components/layout/Footer/Footer.jsx

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
    <footer className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <p className={styles.copyrightText}>
          Copyright {new Date().getFullYear()}. Selo Cidadania. Todos os direitos reservados.
        </p>
        
        <p className={styles.developerText}>
          Desenvolvido por <a href="https://baygroups.com.br" target="_blank" rel="noopener noreferrer" className={styles.agencyLink}>Agência Bay Groups</a>
        </p>
        
        <p className={styles.versionText}>
          Versão: {version}
        </p>
        
        <nav className={styles.footerLinks}>
          <a href="#" className={styles.link} onClick={(e) => handleLinkClick(e, 'privacy_policy')}>
            Política de Privacidade
          </a>
          <span className={styles.separator}>|</span>
          <a href="#" className={styles.link} onClick={(e) => handleLinkClick(e, 'terms_of_use')}>
            Termos de Uso
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;