import React, { useEffect } from 'react';
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
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

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
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to dashboard after login ONLY if on auth or root page
  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser &&
      ['/', '/login', '/register', '/forgot-password'].includes(location.pathname)
    ) {
      let dashboardPath = '/dashboard';
      switch (currentUser.role) {
        case 'admin':
          dashboardPath = '/admin/users';
          break;
        case 'owner':
          dashboardPath = '/dashboard';
          break;
        case 'manager':
          dashboardPath = '/dashboard';
          break;
        case 'cashier':
          dashboardPath = '/dashboard';
          break;
        case 'waiter':
          dashboardPath = '/dashboard';
          break;
        case 'user':
          dashboardPath = '/dashboard';
          break;
        default:
          dashboardPath = '/dashboard';
      }
      if (location.pathname !== dashboardPath) {
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate, location.pathname]);

  const renderAuthHeader = () => {
    let text = "Sign in to manage your loyalty rewards";
    if (location.pathname === '/register') {
      text = "Create an account to start earning rewards";
    } else if (location.pathname === '/forgot-password') {
      text = "Reset your password";
    }

    return (
      <>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary-100 p-3">
              <Award className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Bi Rewards</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{text}</p>
        </div>
      </>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {renderAuthHeader()}

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Routes>
            <Route path="/register" element={<RegisterForm onSuccess={() => navigate('/')} onLoginClick={() => navigate('/')} />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm onLoginClick={() => navigate('/')} />} />
            <Route path="*" element={<LoginForm onRegisterClick={() => navigate('/register')} onForgotPasswordClick={() => navigate('/forgot-password')} />} />
          </Routes>
        </div>
      </div>
    );
  }

  const role = currentUser?.role;

  return (
    <Layout>
      <Routes>
        {/* Owner routes */}
        {role === 'owner' && (
          <>
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/user-growth-trends" element={<UserGrowthTrendsPage />} />
            <Route path="/points-transaction-overview" element={<PointsTransactionOverviewPage />} />
            <Route path="/owner-top-users" element={<OwnerTopUsersPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
        {/* Manager routes */}
        {role === 'manager' && (
          <>
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/top-users" element={<TopUsersPerformancePage />} />
            <Route path="/activity-logs" element={<ActivityLogsPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/redeem-requests" element={<ManagerRedeemRequestsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
        {/* Cashier routes */}
        {role === 'cashier' && (
          <Route path="/dashboard" element={<CashierDashboard />} />
        )}
        {/* Waiter routes */}
        {role === 'waiter' && (
          <Route path="/dashboard" element={<WaiterDashboard />} />
        )}
        {/* Admin routes */}
        {role === 'admin' && (
          <>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/rewards" element={<AdminRewardsPage />} />
            <Route path="/admin/add-points" element={<AddPointsPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </>
        )}
        {/* User routes */}
        {role === 'user' && (
          <>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/support-tickets" element={<SupportTicketsPage />} />
            <Route path="/redeem-requests" element={<UserRedeemRequestsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
};

export default App;
