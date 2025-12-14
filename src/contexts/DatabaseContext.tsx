import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import ApiService from '../services/api';
import { useAuth } from './AuthContext';

type DatabaseMode = 'local' | 'neon';

interface DatabaseContextType {
  mode: DatabaseMode;
  isVercel: boolean;
  canSwitchMode: boolean;
  canSync: boolean;
  isLoading: boolean;
  switchMode: (mode: DatabaseMode) => Promise<void>;
  syncData: () => Promise<{ success: boolean; message: string; data?: any }>;
  refreshStatus: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<DatabaseMode>('local');
  const [isVercel, setIsVercel] = useState(false);
  const [canSwitchMode, setCanSwitchMode] = useState(false);
  const [canSync, setCanSync] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      // Check localStorage first for saved preference
      const savedMode = localStorage.getItem('dbMode') as DatabaseMode | null;
      if (savedMode && (savedMode === 'local' || savedMode === 'neon')) {
        setMode(savedMode);
      }

      // Try to fetch status from API (works without auth now)
      const response = await ApiService.get('/sync/status');
      if (response.success) {
        const apiMode = response.data.mode;
        setMode(apiMode);
        setIsVercel(response.data.isVercel);
        setCanSwitchMode(response.data.canSwitchMode);
        setCanSync(response.data.canSync);
        // Save to localStorage
        localStorage.setItem('dbMode', apiMode);
      }
    } catch (error: any) {
      // Silently handle errors - use defaults
      const savedMode = localStorage.getItem('dbMode') as DatabaseMode | null;
      if (savedMode && (savedMode === 'local' || savedMode === 'neon')) {
        setMode(savedMode);
      } else {
        setMode('local');
      }
      setIsVercel(false);
      setCanSwitchMode(true);
      setCanSync(true);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = async (newMode: DatabaseMode) => {
    try {
      const response = await ApiService.post('/sync/mode', { mode: newMode });
      if (response.success) {
        setMode(response.data.mode);
        setCanSync(newMode === 'local');
        // Save to localStorage
        localStorage.setItem('dbMode', response.data.mode);
        // Show success message
        alert(`Database mode switched to ${newMode}`);
      } else {
        throw new Error(response.message || 'Failed to switch database mode');
      }
    } catch (error: any) {
      console.error('Failed to switch database mode:', error);
      // Still save to localStorage even if API call fails (for offline use)
      localStorage.setItem('dbMode', newMode);
      setMode(newMode);
      setCanSync(newMode === 'local');
      throw error;
    }
  };

  const syncData = async () => {
    try {
      const response = await ApiService.post('/sync/sync-all');
      return {
        success: response.success,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Failed to sync data:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to sync data',
      };
    }
  };

  useEffect(() => {
    // Only refresh status once on mount, not on every auth change
    // This prevents excessive API calls
    const timer = setTimeout(() => {
      refreshStatus();
    }, 500); // Small delay to ensure backend is ready

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Refresh when authentication status changes (but with debounce)
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        refreshStatus();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  return (
    <DatabaseContext.Provider
      value={{
        mode,
        isVercel,
        canSwitchMode,
        canSync,
        isLoading,
        switchMode,
        syncData,
        refreshStatus,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

