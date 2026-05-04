// Arquivo: src/App.jsx (COMPLETO E ATUALIZADO - FASE 2)

import React, { useState, useEffect, useCallback } from 'react';

// Importação da instância da API
import api from './api/api';

// Importação dos componentes de tela e UI
import LoginScreen from './components/auth/LoginScreen/LoginScreen';
import RegisterPage from './pages/auth/RegisterPage/RegisterPage'; 
import AppLayout from './components/layout/AppLayout/AppLayout';
import MaintenanceCountdown from './components/ui/MaintenanceCountdown/MaintenanceCountdown';

// Importação das páginas compartilhadas
import ProfilePage from './pages/shared/ProfilePage/ProfilePage';
import EditProfilePage from './pages/shared/EditProfilePage/EditProfilePage';
import OngDetailsPage from './pages/shared/OngDetailsPage/OngDetailsPage'; 
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
import CreateActivityPage from './pages/admin5/CreateActivityPage/CreateActivityPage';
import Admin5PendingProofsPage from './pages/admin5/PendingProofsPage/PendingProofsPage';
import AdminSubmitProofPage from './pages/admin5/AdminSubmitProofPage/AdminSubmitProofPage';

// ++ NOVAS PÁGINAS FASE 2 (SHOPPING) ++
import ManageProductsPage from './pages/admin5/ManageProductsPage/ManageProductsPage';
import ManageEventsPage from './pages/admin5/ManageEventsPage/ManageEventsPage';

// Importação das páginas de Admin1
import Admin1Dashboard from './pages/admin1/Admin1Dashboard/Admin1Dashboard';
import Admin1PendingProofsPage from './pages/admin1/PendingProofsPage/PendingProofsPage';

// Importação das páginas de ONG
import OngDashboard from './pages/ong/OngDashboard/OngDashboard';
import CreateUserPage from './pages/ong/CreateUserPage/CreateUserPage';
import ListOngUsersPage from './pages/ong/ListOngUsersPage/ListOngUsersPage';
import HelpPage from './pages/ong/HelpPage/HelpPage';
import OngReportsPage from './pages/ong/OngReportsPage/OngReportsPage';
import EditOngPage from './pages/ong/EditOngPage/EditOngPage';
import OngPendingProofsPage from './pages/ong/PendingProofsPage/PendingProofsPage';
import OngCreateActivityPage from './pages/ong/CreateActivityPage/CreateActivityPage';

// Importação das páginas de Usuário
import UserDashboard from './pages/user/UserDashboard/UserDashboard';
import SendSocialProofPage from './pages/user/SendSocialProofPage/SendSocialProofPage';
import MyBalancePage from './pages/user/MyBalancePage/MyBalancePage';
import MyRedemptionsPage from './pages/user/MyRedemptionsPage/MyRedemptionsPage';
import MySocialProofsPage from './pages/user/MySocialProofsPage/MySocialProofsPage';
import MyDependentsPage from './pages/user/MyDependentsPage/MyDependentsPage';
import HelpPageUser from './pages/user/HelpPage/HelpPage';
import UserProfilePage from './pages/user/UserProfilePage/UserProfilePage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentItemId, setCurrentItemId] = useState(null);

  // --- ESTADOS DE MANUTENÇÃO ---
  const [maintenance, setMaintenance] = useState({ 
    isActive: false, 
    startAt: null,
    returnTime: null 
  });

  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const response = await api.get('/system-status');
      if (response.data) {
        setMaintenance({
          isActive: !!response.data.maintenance_mode,
          startAt: response.data.maintenance_start_at,
          returnTime: response.data.estimated_return_at
        });
      }
    } catch (error) {
      console.error("Erro ao verificar manutenção:", error);
    }
  }, []);

  useEffect(() => {
    checkMaintenanceStatus();
    const interval = setInterval(checkMaintenanceStatus, 60000);
    return () => clearInterval(interval);
  }, [checkMaintenanceStatus]);

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
    if (payload.targetUserId) {
      setCurrentItemId(payload.targetUserId);
    }
  };

  useEffect(() => {
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(logout, 900000);
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

  const renderContent = () => {
    if (maintenance.isActive && currentUser?.role !== 'admin5') {
      return (
        <div style={{ padding: '50px', textAlign: 'center', marginTop: '100px' }}>
          <h1 style={{ color: '#d32f2f', fontSize: '2.5rem' }}>🛠️ Manutenção em Andamento</h1>
          <p style={{ fontSize: '1.2rem', color: '#555' }}>
            O sistema está sendo atualizado para melhorar sua experiência.
          </p>
          {maintenance.returnTime && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', display: 'inline-block' }}>
              <strong>Previsão de Retorno:</strong> {new Date(maintenance.returnTime).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      );
    }

    switch (currentPage) {
      case 'profile': return <ProfilePage user={currentUser} onNavigate={navigate} />;
      case 'edit_profile': return <EditProfilePage user={currentUser} onNavigate={navigate} />;
      case 'ong_details': return <OngDetailsPage ongId={currentItemId} onNavigate={navigate} />; 
      case 'privacy_policy': return <PrivacyPolicyPage />;
      case 'terms_of_use': return <TermsOfUsePage />;
      default: break;
    }

    switch (currentUser?.role) {
      case 'admin5':
      case 'admin1':
        switch (currentPage) {
          case 'dashboard': return currentUser.role === 'admin5' ? <Admin5Dashboard onNavigate={navigate} currentUser={currentUser} /> : <Admin1Dashboard onNavigate={navigate} currentUser={currentUser} />;
          case 'create_ong': return <CreateOngPage />;
          case 'list_ongs': return <ListOngsPage onNavigate={navigate} />;
          case 'create_admin': return <CreateAdminPage />;
          case 'list_admins': return <ListAdminsPage />;
          case 'create_user_admin': return <CreateUserAdminPage />;
          case 'list_users': return <ListUsersPage />;
          case 'reports': return <ReportsPage />;
          case 'list_all_users': return <ListAllUsersPage />;
          case 'create_activity': return <CreateActivityPage currentUser={currentUser} />;
          case 'pending_proofs': return currentUser.role === 'admin5' ? <Admin5PendingProofsPage currentUser={currentUser} onNavigate={navigate} /> : <Admin1PendingProofsPage currentUser={currentUser} onNavigate={navigate} />;
          case 'admin_submit_proof': return <AdminSubmitProofPage />;
          case 'manage_products': return <ManageProductsPage />;
          case 'manage_events': return <ManageEventsPage />;
          default: return currentUser.role === 'admin5' ? <Admin5Dashboard onNavigate={navigate} currentUser={currentUser} /> : <Admin1Dashboard onNavigate={navigate} currentUser={currentUser} />;
        }
      
      case 'ong':
        switch (currentPage) {
          case 'dashboard': return <OngDashboard user={currentUser} onNavigate={navigate} />;
          case 'create_user': return <CreateUserPage user={currentUser} />;
          case 'list_ong_users': return <ListOngUsersPage user={currentUser} onNavigate={navigate} />;
          case 'create_activity': return <OngCreateActivityPage user={currentUser} />; 
          case 'ong_reports': return <OngReportsPage currentUser={currentUser} />;
          case 'edit_ong_profile': return <EditOngPage user={currentUser} onNavigate={navigate} />;
          case 'edit_user_profile': return <UserProfilePage user={{ id: currentItemId }} />;
          case 'help': return <HelpPage />;
          case 'pending_proofs': return <OngPendingProofsPage currentUser={currentUser} onNavigate={navigate} />;
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
          case 'user_profile': return <UserProfilePage user={currentUser} />;
          default: return <UserDashboard onNavigate={navigate} />;
        }

      default:
        return <h1>Perfil de utilizador desconhecido.</h1>;
    }
  };

  if (isLoading) return null;

  if (!currentUser) {
    if (window.location.pathname === '/cadastro') {
      return <RegisterPage />;
    }
    return <LoginScreen onLoginSuccess={login} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      
      <MaintenanceCountdown startTime={maintenance.startAt} estimatedReturn={maintenance.returnTime} />

      {maintenance.isActive && currentUser?.role === 'admin5' && (
        <div style={{ backgroundColor: '#ff9800', color: 'white', textAlign: 'center', padding: '8px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 9999 }}>
          ⚠️ MODO MANUTENÇÃO ATIVO: O acesso está restrito apenas ao seu perfil.
        </div>
      )}

      <AppLayout user={currentUser} onNavigate={navigate} onLogout={logout} activePage={currentPage}>
        {renderContent()}
      </AppLayout>
    </div>
  );
}

export default App;