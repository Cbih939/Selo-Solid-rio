import React from 'react';
import styles from './Sidebar.module.css';
import { ICONS } from '../../../assets/icons/ICONS';
import Icon from '../../ui/Icon/Icon';
import logoImage from '../../../assets/images/logo.png';

const Sidebar = ({ userRole, onNavigate, onLogout, activePage, isOpen }) => {
  
  const getMenuItems = (role) => {
    const commonItems = [
      { id: 'profile', text: 'Meu Perfil', icon: ICONS.profile },
      { id: 'edit_profile', text: 'Editar Perfil', icon: ICONS.edit },
    ];

    if (role === 'admin5') {
      return [
        { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
        { id: 'create_admin', text: 'Cadastrar Admin Nv.1', icon: ICONS.addAdmin },
        { id: 'list_admins', text: 'Listar Admins Nv.1', icon: ICONS.list },
        { id: 'create_ong', text: 'Cadastrar ONG', icon: ICONS.ong },
        { id: 'list_ongs', text: 'Listar ONGs', icon: ICONS.list },
        { id: 'create_user_admin', text: 'Cadastrar Usuário', icon: ICONS.addUser },
        { id: 'list_users', text: 'Listar Usuários', icon: ICONS.list },
        { id: 'reports', text: 'Relatórios', icon: ICONS.chart },
        { id: 'create_prize', text: 'Cadastrar Prêmio', icon: ICONS.gift },
        { id: 'list_prizes', text: 'Listar Prêmios', icon: ICONS.list },
        ...commonItems
      ];
    }

    if (role === 'admin1') {
      return [
        { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
        { id: 'create_ong', text: 'Cadastrar ONG', icon: ICONS.ong },
        { id: 'list_ongs', text: 'Listar ONGs', icon: ICONS.list },
        { id: 'create_user_admin', text: 'Cadastrar Usuário', icon: ICONS.addUser },
        { id: 'list_users', text: 'Listar Usuários', icon: ICONS.list },
        { id: 'reports', text: 'Relatórios', icon: ICONS.chart },
        { id: 'create_prize', text: 'Cadastrar Prêmio', icon: ICONS.gift },
        { id: 'list_prizes', text: 'Listar Prêmios', icon: ICONS.list },
        ...commonItems
      ];
    }
    
    if (role === 'ong') {
      return [
        { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
        { id: 'create_user', text: 'Cadastrar Usuário', icon: ICONS.addUser },
        { id: 'list_ong_users', text: 'Listar Usuários', icon: ICONS.list },
        { id: 'acceptance', text: 'Tela de Aceite', icon: ICONS.seal },
        { id: 'help', text: 'Ajuda', icon: ICONS.help },
        ...commonItems
      ];
    }

    if (role === 'user') {
      return [
        { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
        { id: 'send_social_proof', text: 'Enviar Prova Social', icon: ICONS.socialProof },
        { id: 'my_balance', text: 'Meu Saldo', icon: ICONS.wallet },
        { id: 'redeem_prizes', text: 'Resgatar Prêmios', icon: ICONS.redeem },
        { id: 'my_redemptions', text: 'Meus Resgates', icon: ICONS.receipt },
        ...commonItems
      ];
    }

    return [];
  };

  const menuItems = getMenuItems(userRole);
  const sidebarClasses = `${styles.sidebar} ${isOpen ? styles.open : ''}`;

  return (
    <aside className={sidebarClasses}>
      <div className={styles.logoContainer}>
        <img src={logoImage} alt="Selo Cidadania" className={styles.logo} />
        <span className={styles.logoText}>Selo Cidadania</span>
      </div>
      <nav className={styles.nav}>
        {menuItems.map(item => (
          <a
            key={item.id}
            href="#"
            className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
          >
            <Icon path={item.icon} className={styles.navIcon} />
            <span>{item.text}</span>
          </a>
        ))}
      </nav>
      <div className={styles.logoutSection}>
        <a href="#" className={styles.navItem} onClick={(e) => { e.preventDefault(); onLogout(); }}>
          <Icon path={ICONS.logout} className={styles.navIcon} />
          <span>Sair</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;