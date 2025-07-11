import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { LoyaltyProvider } from './context/LoyaltyContext';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import UserDashboard from './components/dashboard/UserDashboard';
import RewardsPage from './components/rewards/RewardsPage';
import TransactionsPage from './components/transactions/TransactionsPage';
import AdminUsersPage from './components/admin/AdminUsersPage';
import AdminRewardsPage from './components/admin/AdminRewardsPage';
import AddPointsPage from './components/admin/AddPointsPage';
import UserProfilePage from './components/profile/UserProfilePage';
import OwnerDashboard from './components/dashboard/OwnerDashboard';
import ManagerDashboard from './components/dashboard/ManagerDashboard';
import CashierDashboard from './components/dashboard/CashierDashboard';
import WaiterDashboard from './components/dashboard/WaiterDashboard';
import SupportTicketsPage from './pages/SupportTicketsPage';
import AdminSupportPage from './pages/AdminSupportPage';
import TopUsersPerformancePage from './components/dashboard/TopUsersPerformancePage';
import ActivityLogsPage from './components/dashboard/ActivityLogsPage';
import UserGrowthTrendsPage from './components/dashboard/UserGrowthTrendsPage';
import PointsTransactionOverviewPage from './components/dashboard/PointsTransactionOverviewPage';
import OwnerTopUsersPage from './components/dashboard/OwnerTopUsersPage';
import UserRedeemRequestsPage from './components/redeemRequests/UserRedeemRequestsPage';
import ManagerRedeemRequestsPage from './components/redeemRequests/ManagerRedeemRequestsPage';

import { Award } from 'lucide-react';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LoyaltyProvider>
        <AppContent />
      </LoyaltyProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgotPassword'
  const [activePage, setActivePage] = useState('dashboard');

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setActivePage(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary-100 p-3">
              <Award className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Bi Rewards</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {authView === 'register' && "Create an account to start earning rewards"}
            {authView === 'login' && "Sign in to manage your loyalty rewards"}
            {authView === 'forgotPassword' && "Reset your password"}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {authView === 'login' && (
            <LoginForm
              onSuccess={() => setActivePage('dashboard')}
              onRegisterClick={() => setAuthView('register')}
              onForgotPasswordClick={() => setAuthView('forgotPassword')}
            />
          )}
          {authView === 'register' && (
            <RegisterForm
              onSuccess={() => setActivePage('dashboard')}
              onLoginClick={() => setAuthView('login')}
            />
          )}
          {authView === 'forgotPassword' && (
            <ForgotPasswordForm 
              onLoginClick={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  const role = currentUser?.role;

  const renderPage = () => {
    switch (role) {
      case 'owner':
        switch (activePage) {
          case 'dashboard':
            return <OwnerDashboard />;
          case 'user-growth-trends':
            return <UserGrowthTrendsPage />;
          case 'points-transaction-overview':
            return <PointsTransactionOverviewPage />;
          case 'owner-top-users':
            return <OwnerTopUsersPage />;
          default:
            return <OwnerDashboard />;
        }
      case 'manager':
        switch (activePage) {
          case 'dashboard':
            return <ManagerDashboard />;
          case 'top-users':
            return <TopUsersPerformancePage />;
          case 'activity-logs':
            return <ActivityLogsPage />;
          case 'admin/support':
            return <AdminSupportPage />;
          case 'redeem-requests':
            return <ManagerRedeemRequestsPage />;
          default:
            return <ManagerDashboard />;
        }
      case 'cashier':
        switch (activePage) {
          case 'dashboard':
          default:
            return <CashierDashboard />;
        }
      case 'waiter':
        switch (activePage) {
          case 'dashboard':
          default:
            return <WaiterDashboard />;
        }
      case 'admin':
        switch (activePage) {
          case 'admin/users':
            return <AdminUsersPage />;
          case 'admin/rewards':
            return <AdminRewardsPage />;
          case 'admin/add-points':
            return <AddPointsPage />;
          case 'admin/support':
            return <AdminSupportPage />;
          default:
            return <AdminUsersPage />;
        }
      case 'user':
        switch (activePage) {
          case 'dashboard':
            return <UserDashboard />;
          case 'rewards':
            return <RewardsPage />;
          case 'transactions':
            return <TransactionsPage />;
          case 'profile':
            return <UserProfilePage />;
          case 'support-tickets':
            return <SupportTicketsPage />;
          case 'redeem-requests':
            return <UserRedeemRequestsPage />;
          default:
            return <UserDashboard />;
        }
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;
