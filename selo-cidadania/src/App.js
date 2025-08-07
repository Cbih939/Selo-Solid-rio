import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/auth/LoginScreen/LoginScreen';
import AppLayout from './components/layout/AppLayout/AppLayout';
import Admin5Dashboard from './pages/admin5/Admin5Dashboard/Admin5Dashboard';
import Admin1Dashboard from './pages/admin1/Admin1Dashboard/Admin1Dashboard';
import OngDashboard from './pages/ong/OngDashboard/OngDashboard';
import UserDashboard from './pages/user/UserDashboard/UserDashboard';
import CreateAdminPage from './pages/admin5/CreateAdminPage/CreateAdminPage';
import ListAdminsPage from './pages/admin5/ListAdminsPage/ListAdminsPage';
import CreateOngPage from './pages/admin5/CreateOngPage/CreateOngPage';
import ListOngsPage from './pages/admin5/ListOngsPage/ListOngsPage';
import ListUsersPage from './pages/admin5/ListUsersPage/ListUsersPage';
import ReportsPage from './pages/admin5/ReportsPage/ReportsPage';
import CreatePrizePage from './pages/admin5/CreatePrizePage/CreatePrizePage';
import ListPrizesPage from './pages/admin5/ListPrizesPage/ListPrizesPage';
import CreateUserPage from './pages/ong/CreateUserPage/CreateUserPage';
import ListOngUsersPage from './pages/ong/ListOngUsersPage/ListOngUsersPage';
import AcceptancePage from './pages/ong/AcceptancePage/AcceptancePage';
import HelpPage from './pages/ong/HelpPage/HelpPage';
import SendSocialProofPage from './pages/user/SendSocialProofPage/SendSocialProofPage';
import MyBalancePage from './pages/user/MyBalancePage/MyBalancePage';
import RedeemPrizesPage from './pages/user/RedeemPrizesPage/RedeemPrizesPage';
import MyRedemptionsPage from './pages/user/MyRedemptionsPage/MyRedemptionsPage';
import ProfilePage from './pages/shared/ProfilePage/ProfilePage';
import EditProfilePage from './pages/shared/EditProfilePage/EditProfilePage';
import CreateUserAdminPage from './pages/admin5/CreateUserAdminPage/CreateUserAdminPage';


function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Erro ao ler o localStorage:", error);
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState('dashboard');

  const login = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setCurrentUser(userData);
    setCurrentPage('dashboard');
  };

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  }, []);

  const navigate = (page) => {
    setCurrentPage(page);
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
    switch (currentPage) {
        case 'profile': return <ProfilePage user={currentUser} onNavigate={navigate} />;
        case 'edit_profile': return <EditProfilePage user={currentUser} onNavigate={navigate} />;
    }

    switch (currentUser?.role) {
      case 'admin5':
        switch (currentPage) {
          case 'dashboard': return <Admin5Dashboard onNavigate={navigate} />;
          case 'create_admin': return <CreateAdminPage />;
          case 'list_admins': return <ListAdminsPage />;
          case 'create_ong': return <CreateOngPage />;
          case 'list_ongs': return <ListOngsPage />;
          case 'create_user_admin': return <CreateUserAdminPage />;
          case 'list_users': return <ListUsersPage />;
          case 'reports': return <ReportsPage />;
          case 'create_prize': return <CreatePrizePage />;
          case 'list_prizes': return <ListPrizesPage />;
          default: return <h1>Página não encontrada para Admin5</h1>;
        }
      
      case 'admin1':
        switch (currentPage) {
            case 'dashboard': return <Admin1Dashboard onNavigate={navigate} />;
            case 'create_ong': return <CreateOngPage />;
            case 'list_ongs': return <ListOngsPage />;
            case 'create_user_admin': return <CreateUserAdminPage />;
            case 'list_users': return <ListUsersPage />;
            case 'reports': return <ReportsPage />;
            case 'create_prize': return <CreatePrizePage />;
            case 'list_prizes': return <ListPrizesPage />;
            default: return <h1>Página não encontrada para Admin1</h1>;
        }

      case 'ong':
        switch (currentPage) {
            case 'dashboard': return <OngDashboard onNavigate={navigate} />;
            case 'create_user': return <CreateUserPage user={currentUser} />;
            case 'list_ong_users': return <ListOngUsersPage user={currentUser} />;
            case 'acceptance': return <AcceptancePage user={currentUser} />;
            case 'help': return <HelpPage />;
            default: return <h1>Página não encontrada para ONG</h1>;
        }

      case 'user':
        switch (currentPage) {
            case 'dashboard': return <UserDashboard onNavigate={navigate} />;
            case 'send_social_proof': return <SendSocialProofPage user={currentUser} />;
            case 'my_balance': return <MyBalancePage user={currentUser} />;
            case 'redeem_prizes': return <RedeemPrizesPage user={currentUser} />;
            case 'my_redemptions': return <MyRedemptionsPage user={currentUser} />;
            default: return <h1>Página não encontrada para Utilizador</h1>;
        }

      default:
        return <h1>Perfil de utilizador desconhecido.</h1>;
    }
  };

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
