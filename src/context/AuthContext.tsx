import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { users } from '../utils/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API request
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const user = users.find(u => u.email === email);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API request
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const existingUser = users.find(u => u.email === email);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (existingUser) {
        setIsLoading(false);
        return false;
      }
      
      // Create new user (in a real app, this would be saved to a database)
      const newUser: User = {
        id: `${users.length + 1}`,
        email,
        name,
        role: 'user',
        points: 0,
        createdAt: new Date().toISOString(),
      };
      
      // In a real app, we would add the user to the database
      users.push(newUser);
      
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};