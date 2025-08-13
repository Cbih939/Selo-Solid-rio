import React from 'react';
import styles from './Footer.module.css';
import packageJson from "../../../../package.json";

const { version } = packageJson;

const Footer = () => {
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
    </footer>
  );
};

export default Footer;
