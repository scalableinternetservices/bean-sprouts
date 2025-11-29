import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { useAuthServices } from './AuthServiceContext';

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authService, isAuthServiceReady } = useAuthServices();

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isAuthServiceReady || !authService) {
        setIsLoading(false);
        return;
      }

      try {
        // Get current user from AuthService
        const currentUser = await authService.refreshToken(); // diff
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isAuthServiceReady, authService]);

  const login = async (username: string, password: string) => {
    if (!isAuthServiceReady || !authService) {
      throw new Error('Auth service not ready');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use AuthService for login
      const authUser = await authService.login(username, password);
      setUser(authUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    if (!isAuthServiceReady || !authService) {
      throw new Error('Auth service not ready');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use AuthService for registration
      const authUser = await authService.register({ username, password });
      setUser(authUser);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (authService) {
      try {
        // Use AuthService for logout
        await authService.logout();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const refreshToken = async () => {
    if (!isAuthServiceReady || !authService) {
      throw new Error('Auth service not ready');
    }

    try {
      // Use AuthService for token refresh (uses session cookie)
      const refreshedUser = await authService.refreshToken();
      setUser(refreshedUser);
    } catch (err) {
      console.error('Token refresh failed:', err);
      await logout(); // Logout on refresh failure
      throw err;
    }
  };

  const value: AuthContextType = {
    // State
    user,
    isLoading,
    isAuthenticated: !!user,
    error,

    // Actions
    login,
    register,
    logout,
    clearError,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
