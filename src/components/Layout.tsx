import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/useAuth';
import { 
  Home, 
  Gift, 
  Clock, 
  User as UserIcon, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Award, 
  ChevronDown,
  Bell,
  MessageCircle
} from 'lucide-react';
import {
  canViewStats,
  canViewPerformanceReports,
  canManageRewards,
  canManageUsers,
  canManagePoints,
  canAddPoints,
  canViewPromotions,
  UserRole
} from '../utils/roleAccess';

interface LayoutProps {
  children: React.ReactNode;
}

// Fungsi untuk menentukan status member berdasarkan poin
const getUserStatus = (points: number) => {
  if (points >= 1000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
};

const statusColors = {
  Gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Silver: 'bg-gray-100 text-gray-800 border-gray-300',
  Bronze: 'bg-amber-100 text-amber-800 border-amber-300',
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState(window.location.hash.replace('#', '') || 'dashboard');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}
const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const userRole = (currentUser?.role as UserRole) || 'user';

  // Fetch notifications for the current user
  useEffect(() => {
    if (!isNotifOpen || !currentUser) return;
    const fetchNotifications = async () => {
      setLoadingNotifs(true);
      try {
        // Replace this URL with your actual notifications API endpoint
        const res = await fetch(`${API_URL}/users/${currentUser.id}/notifications`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.data || []);
        } else {
          // fallback to mock data if API fails
          setNotifications([
            { id: '1', message: 'Welcome to Bi Rewards!', read: false, createdAt: new Date().toISOString() },
          ]);
        }
      } catch {
        setNotifications([
          { id: '1', message: 'Welcome to Bi Rewards!', read: false, createdAt: new Date().toISOString() },
        ]);
      } finally {
        setLoadingNotifs(false);
      }
    };
    fetchNotifications();
  }, [isNotifOpen, currentUser]);
  const userPoints = currentUser?.points || 0;
  const userStatus = getUserStatus(userPoints);
  const badgeClass = statusColors[userStatus as keyof typeof statusColors];

  // Only show member status and profile for 'user' role
  const showMemberStatus = userRole === 'user';

  // Update activeRoute saat hash berubah
  useEffect(() => {
    const onHashChange = () => {
      setActiveRoute(window.location.hash.replace('#', '') || 'dashboard');
      setIsMobileMenuOpen(false); // Tutup menu mobile saat pindah halaman
      setIsUserMenuOpen(false);   // Tutup user menu juga
    };

    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Fungsi untuk pindah halaman via hash
  const handleNavClick = (href: string) => {
    window.location.hash = href;
  };

  if (!isAuthenticated) {
    return <div className="bg-gray-50 min-h-screen">{children}</div>;
  }

  // Define navigation items with role checks
  let navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: Home, show: true },
    { name: 'Rewards', href: 'rewards', icon: Gift, show: canManageRewards(userRole) || userRole === 'user' },
    { name: 'Redeem Requests', href: 'redeem-requests', icon: Gift, show: userRole === 'user' || userRole === 'manager' },
    { name: 'Transactions', href: 'transactions', icon: Clock, show: canManagePoints(userRole) || userRole === 'user' },
    { name: 'Support Tickets', href: 'support-tickets', icon: Bell, show: userRole === 'user' },
    { name: 'Support Center', href: 'admin/support', icon: MessageCircle, show: userRole === 'admin' || userRole === 'manager' },
    { name: 'Manage Users', href: 'admin/users', icon: Users, show: canManageUsers(userRole) },
    { name: 'Manage Rewards', href: 'admin/rewards', icon: Award, show: canManageRewards(userRole) },
    { name: 'Add Points', href: 'admin/add-points', icon: Award, show: canAddPoints(userRole) || canManagePoints(userRole) },
    { name: 'Promotions', href: 'promotions', icon: Gift, show: canViewPromotions(userRole) },
    { name: 'Stats', href: 'stats', icon: Award, show: canViewStats(userRole) },
    { name: 'Performance Reports', href: 'performance', icon: Award, show: canViewPerformanceReports(userRole) },
  ];

  // If owner, show Dashboard, User Growth Trends, and Points Transaction Overview
  if (userRole === 'owner') {
    navigation = [
      { name: 'Dashboard', href: 'dashboard', icon: Home, show: true },
      { name: 'User Growth Trends', href: 'user-growth-trends', icon: Users, show: true },
      { name: 'Points Transaction Overview', href: 'points-transaction-overview', icon: Award, show: true },
      { name: 'Top Users', href: 'owner-top-users', icon: Users, show: true },
    ];
  }
  // If admin, show admin-specific navigation items
  else if (userRole === 'admin') {
    navigation = navigation.filter(item => ['Manage Users', 'Manage Rewards', 'Add Points', 'Support Center'].includes(item.name));
    // Set default route to Manage Users on first load
    if (window.location.hash === '' || window.location.hash === '#dashboard') {
      window.location.hash = 'admin/users';
    }
  }
  // If manager, show manager-specific navigation items
  else if (userRole === 'manager') {
    navigation = [
      { name: 'Dashboard', href: 'dashboard', icon: Home, show: true },
      { name: 'Redeem Requests', href: 'redeem-requests', icon: Gift, show: true },
      { name: 'Top Users Performance', href: 'top-users', icon: Users, show: true },
      { name: 'Activity Logs', href: 'activity-logs', icon: Clock, show: true },
      { name: 'Support Center', href: 'admin/support', icon: MessageCircle, show: true },
    ];
  }
  // If cashier, remove Add Points from navigation
  else if (userRole === 'cashier') {
    navigation = navigation.filter(item => item.name !== 'Add Points');
  }
  // If waiter, remove Add Points and Promotions from navigation
  else if (userRole === 'waiter') {
    navigation = navigation.filter(item => item.name !== 'Add Points' && item.name !== 'Promotions');
  }

  // Filter menu sesuai role
  const filteredNavigation = navigation.filter(item => item.show);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-primary-600 flex items-center">
                  <Award className="mr-2" size={24} />
                  Bi Rewards
                </span>
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
               {/* Notification Button */}
               <div className="relative">
                 <button
                   className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                   onClick={() => setIsNotifOpen((prev) => !prev)}
                   aria-haspopup="true"
                   aria-expanded={isNotifOpen}
                 >
                   <Bell size={20} />
                 </button>
                 {isNotifOpen && (
                   <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white border border-gray-200 rounded-md shadow-lg z-50">
                     <div className="p-4 border-b font-semibold text-gray-700">Notifications</div>
                     <div className="max-h-72 overflow-y-auto">
                       {loadingNotifs ? (
                         <div className="p-4 text-center text-gray-500">Loading...</div>
                       ) : notifications.length === 0 ? (
                         <div className="p-4 text-center text-gray-500">No notifications.</div>
                       ) : (
                         notifications.map((notif) => (
                           <div key={notif.id} className={`px-4 py-2 border-b last:border-b-0 ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                             <div className="text-sm text-gray-800">{notif.message}</div>
                             <div className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                 )}
               </div>

              {/* Status Badge */}
              {showMemberStatus && (
                <span className={`px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>
                  {userStatus} Member
                </span>
              )}

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  type="button"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="p-1 rounded-full border border-primary-300 bg-primary-100 text-primary-700 h-8 w-8 flex items-center justify-center font-semibold">
                    {(currentUser?.name || '').charAt(0)}
                  </div>
                  <span className="ml-2 text-gray-700">{currentUser?.name}</span>
                  <ChevronDown size={16} className="ml-1 text-gray-500" />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{currentUser?.name}</div>
                        <div className="text-gray-500 truncate">{currentUser?.email}</div>
                      </div>
                      {showMemberStatus && (
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            handleNavClick('profile');
                            setIsUserMenuOpen(false);
                          }}
                          role="menuitem"
                        >
                          <UserIcon size={16} className="mr-2 text-gray-500" />
                          Your Profile
                        </button>
                      )}
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={logout}
                        role="menuitem"
                      >
                        <LogOut size={16} className="mr-2 text-red-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden sm:flex sm:flex-col sm:w-64 sm:fixed sm:inset-y-0 sm:pt-16 sm:border-r sm:border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <a
                  key={item.name}
                  href={`#${item.href}`}
                  onClick={() => {
                    window.location.hash = item.href;
                    setActiveRoute(item.href);
                  }}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeRoute === item.href ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  {item.icon && (
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${activeRoute === item.href ? 'text-primary-700' : 'text-gray-500 group-hover:text-gray-500'}`}
                      aria-hidden="true"
                    />
                  )}
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {(currentUser?.name || '').charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{currentUser?.name}</p>
                {showMemberStatus && (
                  <span className={`px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>{userStatus} Member</span>
                )}
              </div>
            </div>
          </div>
        </aside>
        {/* Main content area */}
        <main className="flex-1 ml-0 sm:ml-64">
          {/* Children will be rendered in the other main tag */}
        </main>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 flex z-40" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="font-bold text-xl text-primary-600 flex items-center">
                  <Award className="mr-2" size={20} />
                  Bi Rewards
                </span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {filteredNavigation.map((item) => (
  <a
    key={item.name}
    href={`#${item.href}`}
    onClick={(e) => {
      e.preventDefault();
      handleNavClick(item.href);
      setIsMobileMenuOpen(false);
    }}
    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${activeRoute === item.href ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    {item.icon && (
      <item.icon
        className={`mr-4 flex-shrink-0 h-6 w-6 ${activeRoute === item.href ? 'text-primary-700' : 'text-gray-500 group-hover:text-gray-500'}`}
        aria-hidden="true"
      />
                    )}
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {(currentUser?.name || '').charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700">{currentUser?.name}</p>
                  {showMemberStatus && (
                    <span className={`px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>{userStatus} Member</span>
                  )}
                </div>
              </div>
              <button
                className="ml-auto px-3 py-2 text-sm text-red-600 hover:bg-red-100 rounded-md"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 sm:ml-64 pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Badge component removed as it's not being used

export default Layout;