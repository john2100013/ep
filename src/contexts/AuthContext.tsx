import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Business } from '../types';
import { ApiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    business_name: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth data on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedBusiness = localStorage.getItem('business');

    if (savedToken && savedUser && savedBusiness) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setBusiness(JSON.parse(savedBusiness));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await ApiService.login(email, password);
      const { user, business, token } = response.data;

      setUser(user);
      setBusiness(business);
      setToken(token);

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('business', JSON.stringify(business));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    business_name: string;
  }) => {
    try {
      const response = await ApiService.register(userData);
      const { user, business, token } = response.data;

      setUser(user);
      setBusiness(business);
      setToken(token);

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('business', JSON.stringify(business));
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 [AuthContext] Refreshing user data...');
      const response = await ApiService.get('/auth/profile');
      if (response.success && response.data.user) {
        const updatedUser = response.data.user;
        console.log('🔄 [AuthContext] User data refreshed:', {
          userId: updatedUser.id,
          permissions: {
            can_access_analytics: updatedUser.can_access_analytics,
            can_access_invoices: updatedUser.can_access_invoices,
            can_access_business_settings: updatedUser.can_access_business_settings,
            can_access_financial_accounts: updatedUser.can_access_financial_accounts
          }
        });
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('❌ [AuthContext] Error refreshing user:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setBusiness(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('business');

    // Call logout API
    ApiService.logout().catch(console.error);
  };

  const value: AuthContextType = {
    user,
    business,
    token,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};