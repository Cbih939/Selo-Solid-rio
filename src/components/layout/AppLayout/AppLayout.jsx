import React, { useState } from 'react';
import styles from './AppLayout.module.css';
import Sidebar from '../Sidebar/Sidebar';
import Icon from '../../ui/Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS';
import Footer from '../Footer/Footer';
import useMediaQuery from '../../../hooks/useMediaQuery'; // Importe o novo hook

const AppLayout = ({ user, children, onNavigate, onLogout, activePage }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // =====================================================================
  // CORREÇÃO: Usamos o hook para saber se estamos em uma tela de desktop.
  // A media query '(min-width: 769px)' deve ser a mesma que você usa
  // no seu CSS para diferenciar desktop de mobile.
  // =====================================================================
  const isDesktop = useMediaQuery('(min-width: 769px)');

  return (
    <div className={styles.layout}>
      {/* O overlay só aparece em telas móveis quando o menu está aberto */}
      {!isDesktop && isSidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)}></div>}

      {/* 
        =====================================================================
        A Sidebar agora só é renderizada se for desktop OU se o menu móvel estiver aberto.
        Isso impede que ela bloqueie o botão em telas móveis quando estiver fechada.
        =====================================================================
      */}
      {(isDesktop || isSidebarOpen) && (
        <Sidebar 
          userRole={user.role} 
          onNavigate={(page) => {
            onNavigate(page);
            setSidebarOpen(false); // Fecha o menu ao navegar
          }} 
          onLogout={onLogout} 
          activePage={activePage}
          isOpen={isSidebarOpen} // Passa o estado para a sidebar (para estilização interna, se necessário)
        />
      )}
      
      <main className={styles.mainContent}>
        {/* 
          O cabeçalho móvel só é renderizado se NÃO for desktop.
        */}
        {!isDesktop && (
          <header className={styles.mobileHeader}>
            <button className={styles.menuButton} onClick={() => setSidebarOpen(true)}>
              <Icon path={ICONS.menu} className={styles.menuIcon} />
            </button>
            <span className={styles.headerTitle}>Selo Cidadania</span>
          </header>
        )}
        
        <div className={styles.pageContent}>
          {children}
        </div>
        
        <Footer onNavigate={onNavigate} />
      </main>
    </div>
  );
};

export default AppLayout;
