import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      const res = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setIsLoading(false);
        return false;
      }

      const response = await res.json();
      
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
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  // Registration will keep phone field, but OTP is sent to email, not phone.
  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        // Show backend error message if present
        if (response && response.message) {
          alert(response.message); // Replace with your toast/snackbar as needed
        }
        setIsLoading(false);
        return false;
      }

      // Registration succeeded, OTP sent to email
      setIsLoading(false);
      return true;
    } catch (error) {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};