import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { tokenStore } from '../lib/api/tokenStore';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get('/users/me');
      if (res.data?.success) {
        setUser(res.data.data);
      }
    } catch {
      setUser(null);
      tokenStore.clear();
    }
  }, []);

  // Silent session bootstrap on app mount
  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      try {
        // Attempt silent refresh using HttpOnly cookie
        const res = await apiClient.post('/auth/refresh');
        if (res.data?.success && mounted) {
          tokenStore.set(res.data.data.accessToken);
          await fetchProfile();
        }
      } catch {
        // No active session or cookie expired
        if (mounted) {
          tokenStore.clear();
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    tokenStore.onAuthFailure(() => {
      setUser(null);
    });

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.success) {
      tokenStore.set(res.data.data.accessToken);
      await fetchProfile();
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/signup', { name, email, password });
    return res.data?.data || { message: 'Verification link sent to your email.' };
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
