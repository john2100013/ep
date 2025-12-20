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

  const refreshUser = async () => {
    try {
      console.log('🔄 [AuthContext] Refreshing user data from server...');
      const response = await ApiService.get('/auth/profile');
      console.log('🔄 [AuthContext] Profile API response:', {
        success: response.success,
        hasUser: !!response.data?.user,
        userId: response.data?.user?.id,
        userRole: response.data?.user?.role
      });
      
      if (response.success && response.data.user) {
        const updatedUser = response.data.user;
        console.log('🔄 [AuthContext] User data refreshed from server:', {
          userId: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          permissions: {
            can_access_analytics: updatedUser.can_access_analytics,
            can_access_invoices: updatedUser.can_access_invoices,
            can_access_business_settings: updatedUser.can_access_business_settings,
            can_access_financial_accounts: updatedUser.can_access_financial_accounts,
            can_access_pos: updatedUser.can_access_pos,
            can_access_quotations: updatedUser.can_access_quotations
          },
          allPermissionFields: Object.keys(updatedUser).filter(key => key.startsWith('can_access_'))
        });
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ [AuthContext] User data saved to localStorage');
      } else {
        console.error('❌ [AuthContext] Failed to refresh user - invalid response:', response);
      }
    } catch (error: any) {
      console.error('❌ [AuthContext] Error refreshing user:', error);
      console.error('❌ [AuthContext] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  useEffect(() => {
    // Check for existing auth data on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedBusiness = localStorage.getItem('business');

    if (savedToken && savedUser && savedBusiness) {
      const parsedUser = JSON.parse(savedUser);
      console.log('🔄 [AuthContext] Loading user from localStorage:', {
        userId: parsedUser.id,
        email: parsedUser.email,
        role: parsedUser.role,
        hasPermissions: {
          can_access_analytics: parsedUser.can_access_analytics !== undefined,
          can_access_invoices: parsedUser.can_access_invoices !== undefined,
          can_access_business_settings: parsedUser.can_access_business_settings !== undefined,
          can_access_financial_accounts: parsedUser.can_access_financial_accounts !== undefined
        },
        permissionValues: {
          can_access_analytics: parsedUser.can_access_analytics,
          can_access_invoices: parsedUser.can_access_invoices,
          can_access_business_settings: parsedUser.can_access_business_settings,
          can_access_financial_accounts: parsedUser.can_access_financial_accounts
        }
      });
      
      setToken(savedToken);
      setUser(parsedUser);
      setBusiness(JSON.parse(savedBusiness));
      
      // Always refresh user data on mount to ensure we have latest permissions
      // This is important because permissions might have been updated while user was logged in
      console.log('🔄 [AuthContext] Refreshing user data on mount to get latest permissions...');
      refreshUser().catch((err) => {
        console.error('❌ [AuthContext] Failed to refresh user on mount:', err);
        // If refresh fails, still allow user to continue with cached data
      });
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 [AuthContext] Starting login for:', email);
      const response = await ApiService.login(email, password);
      const { user, business, token } = response.data;

      console.log('🔐 [AuthContext] Login response received:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        hasPermissions: {
          can_access_analytics: user.can_access_analytics !== undefined,
          can_access_invoices: user.can_access_invoices !== undefined,
          can_access_business_settings: user.can_access_business_settings !== undefined,
          can_access_financial_accounts: user.can_access_financial_accounts !== undefined
        },
        permissionValues: {
          can_access_analytics: user.can_access_analytics,
          can_access_invoices: user.can_access_invoices,
          can_access_business_settings: user.can_access_business_settings,
          can_access_financial_accounts: user.can_access_financial_accounts
        },
        allPermissionKeys: Object.keys(user).filter(key => key.startsWith('can_access_'))
      });

      setUser(user);
      setBusiness(business);
      setToken(token);

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('business', JSON.stringify(business));
      console.log('✅ [AuthContext] User data saved to localStorage');
    } catch (error: any) {
      console.error('❌ [AuthContext] Login error:', error);
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