// Arquivo: components/layout/Sidebar/Sidebar.jsx

import React from 'react';
import styles from './Sidebar.module.css';
import { ICONS } from '../../../assets/icons/ICONS';
import Icon from '../../ui/Icon/Icon';
import logoImage from '../../../assets/images/logo.png';

// Use URLs de imagens com proporção 9:16 para um melhor resultado
const carouselImages = [
 'https://i.ibb.co/v6Fv2f0b/slider1.jpg?auto=compress&cs=tinysrgb&w=900&h=1600&dpr=1',
 'https://i.ibb.co/v6Fv2f0b/slider1.jpg?auto=compress&cs=tinysrgb&w=900&h=1600&dpr=1',
 'https://i.ibb.co/v6Fv2f0b/slider1.jpg?auto=compress&cs=tinysrgb&w=900&h=1600&dpr=1',
];

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
    { id: 'create_ong', text: 'Cadastrar OSC', icon: ICONS.ong },
    { id: 'list_ongs', text: 'Listar OSCs', icon: ICONS.list },
    { id: 'create_user_admin', text: 'Cadastrar Beneficiário', icon: ICONS.addUser },
    { id: 'list_users', text: 'Listar Beneficiários', icon: ICONS.list },
    // ++ NOVAS ROTAS ADICIONADAS AQUI ++
    { id: 'create_activity', text: 'Catálogo de Atividades', icon: ICONS.list },
    { id: 'pending_proofs', text: 'Analisar Provas', icon: ICONS.seal },
    { id: 'reports', text: 'Relatórios', icon: ICONS.chart },
    ...commonItems
   ];
  }

  if (role === 'admin1') {
   return [
    { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
    { id: 'create_ong', text: 'Cadastrar OSC', icon: ICONS.ong },
    { id: 'list_ongs', text: 'Listar OSCs', icon: ICONS.list },
    { id: 'create_user_admin', text: 'Cadastrar Beneficiário', icon: ICONS.addUser },
    { id: 'list_users', text: 'Listar Beneficiários', icon: ICONS.list },
    // ++ NOVAS ROTAS ADICIONADAS AQUI ++
    { id: 'create_activity', text: 'Catálogo de Atividades', icon: ICONS.list },
    { id: 'pending_proofs', text: 'Analisar Provas', icon: ICONS.seal },
    { id: 'reports', text: 'Relatórios', icon: ICONS.chart },
    ...commonItems
   ];
  }
  
  if (role === 'ong') {
   return [
    { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
    { id: 'create_user', text: 'Cadastrar Beneficiário', icon: ICONS.addUser },
    { id: 'list_ong_users', text: 'Listar Beneficiários', icon: ICONS.list },
    { id: 'acceptance', text: 'Tela de Aceite', icon: ICONS.seal },
    // ++ NOVAS ROTAS ADICIONADAS AQUI ++
    { id: 'create_activity', text: 'Meu Catálogo', icon: ICONS.list },
    { id: 'pending_proofs', text: 'Analisar Provas', icon: ICONS.seal },
    { id: 'ong_reports', text: 'Relatórios', icon: ICONS.chart },
    { id: 'edit_ong_profile', text: 'Editar Info da OSC', icon: ICONS.ong }, 
    { id: 'help', text: 'Ajuda', icon: ICONS.help },
    ...commonItems
   ];
  }

  if (role === 'user') {
   return [
    { id: 'dashboard', text: 'Dashboard', icon: ICONS.dashboard },
    { id: 'send_social_proof', text: 'Enviar Prova Social', icon: ICONS.send },
    { id: 'my_social_proofs', text: 'Minhas Provas Sociais', icon: ICONS.list },
    { id: 'my_balance', text: 'Meu Saldo', icon: ICONS.wallet },
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

   {/* Estrutura do Carrossel */}
   <div className={styles.carouselContainer}>
    <div className={styles.carouselTrackHorizontal}>
     {carouselImages.map((imageUrl, index) => (
      <div key={index} className={styles.carouselSlide}>
       <img src={imageUrl} alt={`Imagem do carrossel ${index + 1}`} />
      </div>
     ))}
    </div>
   </div>

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