import React, { useState } from 'react';
import styles from './AppLayout.module.css';
import Sidebar from '../Sidebar/Sidebar';
import Icon from '../../ui/Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS';
import Footer from '../Footer/Footer';

const AppLayout = ({ user, children, onNavigate, onLogout, activePage }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)}></div>}

      <Sidebar 
        userRole={user.role} 
        onNavigate={(page) => {
          onNavigate(page);
          setSidebarOpen(false);
        }} 
        onLogout={onLogout} 
        activePage={activePage}
        isOpen={isSidebarOpen}
      />
      
      <main className={styles.mainContent}>
        <header className={styles.mobileHeader}>
          <button className={styles.menuButton} onClick={() => setSidebarOpen(true)}>
            <Icon path={ICONS.menu} className={styles.menuIcon} />
          </button>
          <span className={styles.headerTitle}>Selo Cidadania</span>
        </header>
        
        {/* O conteúdo da página é renderizado aqui */}
        <div className={styles.pageContent}>
          {children}
        </div>
        
        {/* O rodapé é adicionado aqui, no final da área de conteúdo */}
        <Footer />
      </main>
    </div>
  );
};

export default AppLayout;