'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'rider' | 'driver' | 'admin';
  ecoScore: number;
  totalCarbonSaved: number;
  currentStreak: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map backend user to frontend User interface (defined outside component)
const mapBackendUser = (backendUser: any): User => ({
  id: backendUser.id,
  email: backendUser.email,
  fullName: `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim() || backendUser.email,
  phone: backendUser.phone,
  role: backendUser.role,
  ecoScore: backendUser.ecoStats?.ecoPoints || 0,
  totalCarbonSaved: backendUser.ecoStats?.totalCo2Saved || 0,
  currentStreak: backendUser.ecoStats?.currentStreak || 0,
  createdAt: backendUser.createdAt,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await api.getProfile();
      // Map backend user format to frontend format
      if (response && response.user) {
        setUser(mapBackendUser(response.user));
      } else if (response) {
        // Handle case where response is the user directly
        setUser(mapBackendUser(response));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      api.setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await api.login(email, password);
      setUser(mapBackendUser(user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const { user } = await api.register(data);
      setUser(mapBackendUser(user));
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; phone?: string }) => {
    const response = await api.updateProfile(data);
    if (response && response.user) {
      setUser(mapBackendUser(response.user));
    } else if (response) {
      setUser(mapBackendUser(response));
    }
    return response;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
