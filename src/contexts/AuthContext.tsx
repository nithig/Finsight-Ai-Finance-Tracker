import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';
import type { User } from '../lib/database.types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    setUser(null);
    setError(null);
    apiClient.setToken(null);
  }, []);

  useEffect(() => {
    // Listen for forced logout events (e.g., expired token)
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [handleLogout]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
        const response = await apiClient.getProfile();
        setUser(response.user);
      }
    } catch {
      localStorage.removeItem('token');
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await apiClient.login(email, password);
      apiClient.setToken(response.token);
      setUser(response.user);
      return { error: null };
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  const signUp = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      setError(null);
      const response = await apiClient.signup(name, email, password, confirmPassword);
      apiClient.setToken(response.token);
      setUser(response.user);
      return { error: null };
    } catch (err: any) {
      const errorMsg = err.message || 'Signup failed';
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  const signOut = () => {
    handleLogout();
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
