import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoyaltyProvider } from './context/LoyaltyContext';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
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
  const [isRegistering, setIsRegistering] = useState(false);
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
            {isRegistering
              ? "Create an account to start earning rewards"
              : "Sign in to manage your loyalty rewards"}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {isRegistering ? (
            <RegisterForm
              onSuccess={() => setActivePage('dashboard')}
              onLoginClick={() => setIsRegistering(false)}
            />
          ) : (
            <LoginForm
              onSuccess={() => setActivePage('dashboard')}
              onRegisterClick={() => setIsRegistering(true)}
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
        return <OwnerDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'cashier':
        return <CashierDashboard />;
      case 'waiter':
        return <WaiterDashboard />;
      case 'admin':
        switch (activePage) {
          case 'admin/users':
            return <AdminUsersPage />;
          case 'admin/rewards':
            return <AdminRewardsPage />;
          case 'admin/add-points':
            return <AddPointsPage />;
          default:
            return <UserDashboard />;
        }
      case 'user':
      default:
        switch (activePage) {
          case 'rewards':
            return <RewardsPage />;
          case 'transactions':
            return <TransactionsPage />;
          case 'profile':
            return <UserProfilePage />;
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
