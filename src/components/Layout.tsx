import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
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
  MessageCircle,
  Sun,
  Moon
} from 'lucide-react';
import {
  canManageRewards,
  canManageUsers,
  canManagePoints,
  canAddPoints,
  canViewPromotions,
  UserRole
} from '../utils/roleAccess';
import { Link, useNavigate, useLocation } from 'react-router-dom';

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
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Define navigation items with role checks
  let navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { name: 'Rewards', href: '/rewards', icon: Gift, show: canManageRewards(userRole) || userRole === 'user' },
    { name: 'Redeem Requests', href: '/redeem-requests', icon: Gift, show: userRole === 'user' || userRole === 'manager' },
    { name: 'User Growth Trends', href: '/user-growth-trends', icon: Users, show: userRole === 'owner' },
    { name: 'Points Transaction Overview', href: '/points-transaction-overview', icon: Award, show: userRole === 'owner' },
    { name: 'Top Users', href: '/owner-top-users', icon: Users, show: userRole === 'owner' },
    { name: 'Manage Users', href: '/admin/users', icon: Users, show: userRole === 'admin' },
    { name: 'Manage Rewards', href: '/admin/rewards', icon: Gift, show: userRole === 'admin' },
    { name: 'Add Points', href: '/admin/add-points', icon: Award, show: userRole === 'admin' },
    { name: 'Support Center', href: '/admin/support', icon: MessageCircle, show: userRole === 'admin' || userRole === 'manager' },
    { name: 'Transactions', href: '/transactions', icon: Clock, show: userRole === 'user' },
    { name: 'Profile', href: '/profile', icon: UserIcon, show: userRole === 'user' },
    { name: 'Support Tickets', href: '/support-tickets', icon: MessageCircle, show: userRole === 'user' },
  ];
  navigation = navigation.filter(item => item.show);

  // Add logout redirect to root
  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!isAuthenticated) {
    return <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">{children}</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-primary-600 dark:text-primary-400 flex items-center">
                  <Award className="mr-2" size={24} />
                  Bi Rewards
                </span>
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="sr-only">Toggle theme</span>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

               {/* Notification Button */}
               <div className="relative">
                 <button
                   className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                   onClick={() => setIsNotifOpen((prev) => !prev)}
                   aria-haspopup="true"
                   aria-expanded={isNotifOpen}
                 >
                   <Bell size={20} />
                 </button>
                 {isNotifOpen && (
                   <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                     <div className="p-4 border-b font-semibold text-gray-700 dark:text-gray-200 dark:border-gray-600">Notifications</div>
                     <div className="max-h-72 overflow-y-auto">
                       {loadingNotifs ? (
                         <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                       ) : notifications.length === 0 ? (
                         <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications.</div>
                       ) : (
                         notifications.map((notif) => (
                           <div key={notif.id} className={`px-4 py-2 border-b last:border-b-0 dark:border-gray-700 ${notif.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/50'}`}>
                             <div className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</div>
                             <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                 )}
               </div>

              {/* Status Badge */}
              {showMemberStatus && (
                <span className={`px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>{userStatus} Member</span>
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
                  <div className="p-1 rounded-full border border-primary-300 dark:border-primary-600 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 h-8 w-8 flex items-center justify-center font-semibold">
                    {(currentUser?.name || '').charAt(0)}
                  </div>
                  <span className="ml-2 text-gray-700 dark:text-gray-200">{currentUser?.name}</span>
                  <ChevronDown size={16} className="ml-1 text-gray-500 dark:text-gray-400" />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                        <div className="font-medium">{currentUser?.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</div>
                      </div>
                      {showMemberStatus && (
                        <Link
                          to="/profile"
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <UserIcon size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                          Your Profile
                        </Link>
                      )}
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleLogout}
                        role="menuitem"
                      >
                        <X size={16} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button and icons */}
            <div className="flex items-center sm:hidden space-x-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="sr-only">Toggle theme</span>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notification Button */}
              <div className="relative">
                <button
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                >
                  <Bell size={20} />
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    <div className="p-4 border-b font-semibold text-gray-700 dark:text-gray-200 dark:border-gray-600">Notifications</div>
                    <div className="max-h-72 overflow-y-auto">
                      {loadingNotifs ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`px-4 py-2 border-b last:border-b-0 dark:border-gray-700 ${notif.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/50'}`}>
                            <div className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden sm:flex sm:flex-col sm:w-64 sm:fixed sm:inset-y-0 sm:pt-16 sm:border-r sm:border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location.pathname.startsWith(item.href) ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon && (
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${location.pathname.startsWith(item.href) ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}
                      aria-hidden="true"
                    />
                  )}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold">
                  {(currentUser?.name || '').charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{currentUser?.name}</p>
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="font-bold text-xl text-primary-600 dark:text-primary-400 flex items-center">
                  <Award className="mr-2" size={20} />
                  Bi Rewards
                </span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${location.pathname.startsWith(item.href) ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {item.icon && (
                      <item.icon
                        className={`mr-4 flex-shrink-0 h-6 w-6 ${location.pathname.startsWith(item.href) ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}
                        aria-hidden="true"
                      />
                    )}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold">
                    {(currentUser?.name || '').charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">{currentUser?.name}</p>
                  {showMemberStatus && (
                    <span className={`px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>{userStatus} Member</span>
                  )}
                </div>
              </div>
              <button
                className="ml-auto px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-gray-700 rounded-md"
                onClick={handleLogout}
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

export default Layout;