import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../utils/api';

export interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      // Merge token into user object if not present
      if (storedToken && !userObj.token) {
        userObj.token = storedToken;
      }
      setCurrentUser(userObj);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { email, password });
      
      if (response.success && response.token && response.data) {
        // Merge token into user object
        const userWithToken = { ...response.data, token: response.token };
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        setCurrentUser(userWithToken);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  // Registration will keep phone field, but OTP is sent to email, not phone.
  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post('/users/register', { name, email, phone, password });

      // If backend sends success false
      if (!response.success) {
        if (response.message) {
          alert(response.message);
        }
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      alert('Registration failed. Please try again.');
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
        setCurrentUser,
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
