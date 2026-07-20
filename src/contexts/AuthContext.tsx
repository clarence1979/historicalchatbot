import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginWithCredentials } from '../services/authService';
import { attemptAutoLogin, isInIframe } from '../utils/auto-login';

interface User {
  username: string;
  isAdmin: boolean;
  openaiApiKey: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username: string, password: string) => {
    const result = await loginWithCredentials(username, password);

    const userData: User = {
      username: result.username,
      isAdmin: result.isAdmin,
      openaiApiKey: result.openaiApiKey,
    };
    setUser(userData);
    setIsAuthenticated(true);
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.clear();
    localStorage.removeItem('VITE_OPENAI_API_KEY');
    localStorage.removeItem('VITE_CLAUDE_API_KEY');
    localStorage.removeItem('VITE_GEMINI_API_KEY');
    localStorage.removeItem('VITE_REPLICATE_API_KEY');
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
  };

  useEffect(() => {
    const initAuth = async () => {
      // Restore session from cache (works for both iframe and standalone)
      const cachedUser = sessionStorage.getItem('auth_user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch {
          sessionStorage.removeItem('auth_user');
        }
        setIsLoading(false);
        return;
      }

      // Attempt auto-login when running inside an iframe
      if (isInIframe()) {
        const result = await attemptAutoLogin();
        if (result.authenticated) {
          const userData: User = {
            username: result.username!,
            isAdmin: result.isAdmin || false,
            openaiApiKey: result.apiKey || localStorage.getItem('VITE_OPENAI_API_KEY') || '',
          };
          setUser(userData);
          setIsAuthenticated(true);
          sessionStorage.setItem('auth_user', JSON.stringify(userData));
        }
      }

      setIsLoading(false);
    };

    initAuth();

    const handleBeforeUnload = () => {
      if (!isInIframe()) {
        sessionStorage.clear();
        localStorage.clear();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
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
