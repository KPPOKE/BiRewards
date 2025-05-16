import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Bell
} from 'lucide-react';
import Button from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

// Tambahkan fungsi dan warna tier di sini
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
  const [activeRoute, setActiveRoute] = useState('dashboard');

  const isAdmin = currentUser?.role === 'admin';

  // Ambil status dan warna badge
  const userPoints = currentUser?.points || 0;
  const userStatus = getUserStatus(userPoints);
  const badgeClass = statusColors[userStatus as keyof typeof statusColors];

  // Close the mobile menu when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeRoute]);

  const navigation = [
    { name: 'Dashboard', href: '#dashboard', icon: Home, admin: false },
    { name: 'Rewards', href: '#rewards', icon: Gift, admin: false },
    { name: 'Transactions', href: '#transactions', icon: Clock, admin: false },
    { name: 'Manage Users', href: '#admin/users', icon: Users, admin: true },
    { name: 'Manage Rewards', href: '#admin/rewards', icon: Award, admin: true },
    { name: 'Add Points', href: '#admin/add-points', icon: Award, admin: true },
  ];

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => !item.admin || isAdmin);

  const handleNavClick = (href: string) => {
    window.location.hash = href; // inilah pemicu utama perpindahan halaman
  };

  if (!isAuthenticated) {
    return <div className="bg-gray-50 min-h-screen">{children}</div>;
  }

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
                  BI Loyal
                </span>
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {/* Notifications */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
                <Bell size={20} />
              </button>
              
              {/* Status Member Badge */}
              <span className={`ml-4 px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>
                {userStatus} Member
              </span>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="p-1 rounded-full border border-primary-300 bg-primary-100 text-primary-700 h-8 w-8 flex items-center justify-center">
                      {currentUser?.name.charAt(0)}
                    </div>
                    <span className="ml-2 text-gray-700">{currentUser?.name}</span>
                    <ChevronDown size={16} className="ml-1 text-gray-500" />
                  </button>
                </div>
                
                {isUserMenuOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{currentUser?.name}</div>
                        <div className="text-gray-500 truncate">{currentUser?.email}</div>
                      </div>
                      <button 
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => handleNavClick('#profile')}
                      >
                        <UserIcon size={16} className="mr-2 text-gray-500" />
                        Your Profile
                      </button>
                      <button 
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={logout}
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
        <div className="hidden sm:flex sm:flex-col sm:w-64 sm:fixed sm:inset-y-0 sm:pt-16 sm:border-r sm:border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${
                      window.location.hash.replace('#', '') === item.href.replace('#', '')
                       ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }

                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 flex-shrink-0 h-5 w-5
                        ${
                          window.location.hash.replace('#', '') === item.href.replace('#', '')


                            ? 'text-primary-700'
                            : 'text-gray-500 group-hover:text-gray-500'
                        }
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {currentUser?.name.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{currentUser?.name}</p>
                <div className="flex items-center">
                  <Badge
                    points={currentUser?.points || 0}
                    className="inline-flex text-xs text-primary-600"
                  />
                  {/* Tambahkan badge status member di bawah sidebar */}
                  <span className={`ml-2 px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>
                    {userStatus} Member
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMobileMenuOpen && (
          <div className="sm:hidden fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <span className="font-bold text-xl text-primary-600 flex items-center">
                    <Award className="mr-2" size={20} />
                    BI Loyal
                  </span>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {filteredNavigation.map(item => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(item.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          group flex items-center px-2 py-2 text-base font-medium rounded-md
                          ${
                            window.location.hash.replace('#', '') === item.href.replace('#', '')

                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <item.icon
                          className={`
                            mr-4 flex-shrink-0 h-6 w-6
                            ${
                              window.location.hash.replace('#', '') === item.href.replace('#', '')

                                ? 'text-primary-700'
                                : 'text-gray-500 group-hover:text-gray-500'
                            }
                          `}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                      {currentUser?.name.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700">{currentUser?.name}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logout}
                      leftIcon={<LogOut size={16} />}
                      className="mt-1"
                    >
                      Sign out
                    </Button>
                    {/* Tambahkan badge status member di bawah sidebar mobile */}
                    <span className={`ml-2 px-2 py-1 rounded border text-xs font-semibold ${badgeClass}`}>
                      {userStatus} Member
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 sm:pl-64 pb-10">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Points badge component
const Badge: React.FC<{ points: number; className?: string }> = ({ points, className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Award size={14} className="mr-1" />
      <span>{points} points</span>
    </div>
  );
};

export default Layout;