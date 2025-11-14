import React from 'react';
import styles from './Footer.module.css';
import packageJson from "../../../../package.json";

const { version } = packageJson;

// 1. Recebemos 'onNavigate' como propriedade
const Footer = ({ onNavigate }) => {

  // 2. Definimos a função que estava em falta
  const handleLinkClick = (e, page) => {
    e.preventDefault(); // Evita que a página recarregue
    if (onNavigate) {
      onNavigate(page); // Chama a navegação do App.jsx
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
        {/* Agora a função handleLinkClick já existe e vai funcionar */}
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