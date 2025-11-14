// Arquivo: App.jsx (CORRIGIDO)

import React, { useState, useEffect, useCallback } from 'react';

// Importação dos componentes de tela
import LoginScreen from './components/auth/LoginScreen/LoginScreen';
import AppLayout from './components/layout/AppLayout/AppLayout';

// Importação das páginas compartilhadas
import ProfilePage from './pages/shared/ProfilePage/ProfilePage';
import EditProfilePage from './pages/shared/EditProfilePage/EditProfilePage';
import OngDetailsPage from './pages/shared/OngDetailsPage/OngDetailsPage'; 
// ++ NOVAS IMPORTAÇÕES ADICIONADAS ++
import PrivacyPolicyPage from './pages/shared/PrivacyPolicyPage/PrivacyPolicyPage';
import TermsOfUsePage from './pages/shared/TermsOfUsePage/TermsOfUsePage';

// Importação das páginas de Admin5
import Admin5Dashboard from './pages/admin5/Admin5Dashboard/Admin5Dashboard';
import CreateAdminPage from './pages/admin5/CreateAdminPage/CreateAdminPage';
import ListAdminsPage from './pages/admin5/ListAdminsPage/ListAdminsPage';
import CreateOngPage from './pages/admin5/CreateOngPage/CreateOngPage';
import ListOngsPage from './pages/admin5/ListOngsPage/ListOngsPage';
import ListUsersPage from './pages/admin5/ListUsersPage/ListUsersPage';
import ReportsPage from './pages/admin5/ReportsPage/ReportsPage';
import CreateUserAdminPage from './pages/admin5/CreateUserAdminPage/CreateUserAdminPage';
import ListAllUsersPage from './pages/admin5/ListAllUsersPage/ListAllUsersPage';

// Importação das páginas de Admin1
import Admin1Dashboard from './pages/admin1/Admin1Dashboard/Admin1Dashboard';

// Importação das páginas de ONG
import OngDashboard from './pages/ong/OngDashboard/OngDashboard';
import CreateUserPage from './pages/ong/CreateUserPage/CreateUserPage';
import ListOngUsersPage from './pages/ong/ListOngUsersPage/ListOngUsersPage';
import AcceptancePage from './pages/ong/AcceptancePage/AcceptancePage';
import HelpPage from './pages/ong/HelpPage/HelpPage';
import OngReportsPage from './pages/ong/OngReportsPage/OngReportsPage';
import EditOngPage from './pages/ong/EditOngPage/EditOngPage';

// Importação das páginas de Usuário
import UserDashboard from './pages/user/UserDashboard/UserDashboard';
import SendSocialProofPage from './pages/user/SendSocialProofPage/SendSocialProofPage';
import MyBalancePage from './pages/user/MyBalancePage/MyBalancePage';
import MyRedemptionsPage from './pages/user/MyRedemptionsPage/MyRedemptionsPage';
import MySocialProofsPage from './pages/user/MySocialProofsPage/MySocialProofsPage';
import MyDependentsPage from './pages/user/MyDependentsPage/MyDependentsPage';
import HelpPageUser from './pages/user/HelpPage/HelpPage';

function App() {
 const [currentUser, setCurrentUser] = useState(null);
 const [isLoading, setIsLoading] = useState(true);
 const [currentPage, setCurrentPage] = useState('dashboard');
 
 const [currentItemId, setCurrentItemId] = useState(null);

 useEffect(() => {
  try {
   const savedUser = localStorage.getItem('currentUser');
   if (savedUser) {
    setCurrentUser(JSON.parse(savedUser));
   }
  } catch (error) {
   console.error("Erro ao ler o usuário do localStorage:", error);
   localStorage.removeItem('currentUser');
  }
  setIsLoading(false);
 }, []);

 const login = (apiResponse) => {
  const user = apiResponse.user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  setCurrentUser(user);
  setCurrentPage('dashboard');
 };

 const logout = useCallback(() => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  setCurrentUser(null);
  setCurrentItemId(null);
 }, []);

 const navigate = (page, payload = {}) => {
  setCurrentPage(page);
  if (payload.ongId) {
   setCurrentItemId(payload.ongId);
  }
 };

 useEffect(() => {
  let inactivityTimer;
  const resetTimer = () => {
   clearTimeout(inactivityTimer);
   inactivityTimer = setTimeout(logout, 900000); // 15 minutos
  };

  if (currentUser) {
   window.addEventListener('mousemove', resetTimer);
   window.addEventListener('keydown', resetTimer);
   resetTimer();
  }

  return () => {
   clearTimeout(inactivityTimer);
   window.removeEventListener('mousemove', resetTimer);
   window.removeEventListener('keydown', resetTimer);
  };
 }, [currentUser, logout]);

 const renderPage = () => {
  // Páginas compartilhadas que não dependem do 'role'
  switch (currentPage) {
    case 'profile': return <ProfilePage user={currentUser} onNavigate={navigate} />;
    case 'edit_profile': return <EditProfilePage user={currentUser} onNavigate={navigate} />;
    case 'ong_details': return <OngDetailsPage ongId={currentItemId} onNavigate={navigate} />;  

        // ++ NOVAS ROTAS ADICIONADAS AQUI ++
    case 'privacy_policy': return <PrivacyPolicyPage />;
    case 'terms_of_use': return <TermsOfUsePage />;
  }

  // Renderização baseada no 'role' do usuário
  switch (currentUser?.role) {
   case 'admin5':
   case 'admin1':
    switch (currentPage) {
     case 'dashboard': 
      return currentUser.role === 'admin5' ? <Admin5Dashboard onNavigate={navigate} /> : <Admin1Dashboard onNavigate={navigate} />;
     case 'create_ong': return <CreateOngPage />;
     case 'list_ongs': return <ListOngsPage onNavigate={navigate} />;
     case 'create_admin': return <CreateAdminPage />;
     case 'list_admins': return <ListAdminsPage />;
     case 'create_user_admin': return <CreateUserAdminPage />;
     case 'list_users': return <ListUsersPage />;
     case 'reports': return <ReportsPage />;
     case 'list_all_users': return <ListAllUsersPage />;
     default: 
      return currentUser.role === 'admin5' ? <Admin5Dashboard onNavigate={navigate} /> : <Admin1Dashboard onNavigate={navigate} />;
    }
   
   case 'ong':
    switch (currentPage) {
      case 'dashboard': return <OngDashboard user={currentUser} onNavigate={navigate} />;
      case 'create_user': return <CreateUserPage user={currentUser} />;
      case 'list_ong_users': return <ListOngUsersPage user={currentUser} />;
      case 'acceptance': return <AcceptancePage user={currentUser} />;
      case 'ong_reports': return <OngReportsPage user={currentUser} />;
      case 'edit_ong_profile': return <EditOngPage user={currentUser} onNavigate={navigate} />;
      case 'help': return <HelpPage />;
      default: return <OngDashboard user={currentUser} onNavigate={navigate} />;
    }

   case 'user':
    switch (currentPage) {
      case 'dashboard': return <UserDashboard onNavigate={navigate} />;
      case 'send_social_proof': return <SendSocialProofPage user={currentUser} />;
      case 'my_social_proofs': return <MySocialProofsPage user={currentUser} />;
      case 'my_balance': return <MyBalancePage />;
      case 'my_dependents': return <MyDependentsPage />;
      case 'user_help': return <HelpPageUser />;
//... (você tinha um `sectionTitle:` e `tranformation:` perdidos aqui, eu removi)
      default: return <UserDashboard onNavigate={navigate} />;
    }

   default:
    return <h1>Perfil de utilizador desconhecido.</h1>;
  }
 };

 if (isLoading) {
  return null; 
 }

 if (!currentUser) {
  return <LoginScreen onLoginSuccess={login} />;
 }

 return (
  <AppLayout 
   user={currentUser} 
   onNavigate={navigate} 
   onLogout={logout} 
   activePage={currentPage}
  >
   {renderPage()}
  </AppLayout>
 );
}

export default App;