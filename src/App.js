import React, { useState, useEffect, useCallback } from 'react';

// Importação dos componentes de tela
import LoginScreen from './components/auth/LoginScreen/LoginScreen';
import AppLayout from './components/layout/AppLayout/AppLayout';

// Importação das páginas
import ProfilePage from './pages/shared/ProfilePage/ProfilePage';
import EditProfilePage from './pages/shared/EditProfilePage/EditProfilePage';
import Admin5Dashboard from './pages/admin5/Admin5Dashboard/Admin5Dashboard';
import CreateAdminPage from './pages/admin5/CreateAdminPage/CreateAdminPage';
import ListAdminsPage from './pages/admin5/ListAdminsPage/ListAdminsPage';
import CreateOngPage from './pages/admin5/CreateOngPage/CreateOngPage';
import ListOngsPage from './pages/admin5/ListOngsPage/ListOngsPage';
import ListUsersPage from './pages/admin5/ListUsersPage/ListUsersPage';
import ReportsPage from './pages/admin5/ReportsPage/ReportsPage';
import CreateUserAdminPage from './pages/admin5/CreateUserAdminPage/CreateUserAdminPage';
import ListAllUsersPage from './pages/admin5/ListAllUsersPage/ListAllUsersPage';
import Admin1Dashboard from './pages/admin1/Admin1Dashboard/Admin1Dashboard';
import OngDashboard from './pages/ong/OngDashboard/OngDashboard';
import CreateUserPage from './pages/ong/CreateUserPage/CreateUserPage';
import ListOngUsersPage from './pages/ong/ListOngUsersPage/ListOngUsersPage';
import AcceptancePage from './pages/ong/AcceptancePage/AcceptancePage';
import HelpPage from './pages/ong/HelpPage/HelpPage';
import OngReportsPage from './pages/ong/OngReportsPage/OngReportsPage';
import UserDashboard from './pages/user/UserDashboard/UserDashboard';
import SendSocialProofPage from './pages/user/SendSocialProofPage/SendSocialProofPage';
import MyBalancePage from './pages/user/MyBalancePage/MyBalancePage';
import RedeemPrizesPage from './pages/user/RedeemPrizesPage/RedeemPrizesPage';
import MyRedemptionsPage from './pages/user/MyRedemptionsPage/MyRedemptionsPage';
import MySocialProofsPage from './pages/user/MySocialProofsPage/MySocialProofsPage';
import MyDependentsPage from './pages/user/MyDependentsPage/MyDependentsPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento inicial
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Efeito para carregar o usuário do localStorage de forma segura na inicialização
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Erro ao ler o usuário do localStorage:", error);
      localStorage.removeItem('currentUser'); // Limpa o localStorage se estiver corrompido
    }
    setIsLoading(false); // Finaliza o estado de carregamento
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez

  // Função de login corrigida para extrair e salvar apenas o objeto 'user'
  const login = (apiResponse) => {
    const user = apiResponse.user; // Extrai o objeto 'user' da resposta
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  // Função de logout
  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // Também remove o token
    setCurrentUser(null);
  }, []);

  // Função de navegação
  const navigate = (page) => {
    setCurrentPage(page);
  };

  // Efeito para logout por inatividade
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

  // Função que renderiza a página correta baseada no estado atual
  const renderPage = () => {
    // Páginas compartilhadas que não dependem do 'role'
    switch (currentPage) {
        case 'profile': return <ProfilePage user={currentUser} onNavigate={navigate} />;
        case 'edit_profile': return <EditProfilePage user={currentUser} onNavigate={navigate} />;
    }

    // Renderização baseada no 'role' do usuário
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
          case 'list_all_users': return <ListAllUsersPage />;
          default: return <Admin5Dashboard onNavigate={navigate} />; // Página padrão
        }
      
      case 'admin1':
        switch (currentPage) {
            case 'dashboard': return <Admin1Dashboard onNavigate={navigate} />;
            case 'create_ong': return <CreateOngPage />;
            case 'list_ongs': return <ListOngsPage />;
            case 'create_user_admin': return <CreateUserAdminPage />;
            case 'list_users': return <ListUsersPage />;
            case 'reports': return <ReportsPage />;
            default: return <Admin1Dashboard onNavigate={navigate} />; // Página padrão
        }

      case 'ong':
        switch (currentPage) {
            case 'dashboard': return <OngDashboard user={currentUser} onNavigate={navigate} />;
            case 'create_user': return <CreateUserPage user={currentUser} />;
            case 'list_ong_users': return <ListOngUsersPage user={currentUser} />;
            case 'acceptance': return <AcceptancePage user={currentUser} />;
            case 'ong_reports': return <OngReportsPage user={currentUser} />;
            case 'help': return <HelpPage />;
            default: return <OngDashboard user={currentUser} onNavigate={navigate} />; // Página padrão
        }

      case 'user':
        switch (currentPage) {
            case 'dashboard': return <UserDashboard onNavigate={navigate} />;
            case 'send_social_proof': return <SendSocialProofPage user={currentUser} />;
            case 'my_social_proofs': return <MySocialProofsPage user={currentUser} />;
            case 'my_balance': return <MyBalancePage user={currentUser} />;
            case 'my_dependents': return <MyDependentsPage />;
            case 'my_redemptions': return <MyRedemptionsPage user={currentUser} />;
            default: return <UserDashboard onNavigate={navigate} />; // Página padrão
        }

      default:
        // Este caso só deve acontecer se o 'role' for inválido ou nulo
        return <h1>Perfil de utilizador desconhecido.</h1>;
    }
  };

  // Durante o carregamento inicial, não renderiza nada para evitar piscar a tela
  if (isLoading) {
    return null; 
  }

  // Se não houver usuário, renderiza a tela de login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={login} />;
  }

  // Se houver usuário, renderiza o layout principal da aplicação
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
