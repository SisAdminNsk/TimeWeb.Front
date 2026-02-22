import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authClient } from './api/AuthClient';
import type { UserSession } from './api/AuthClient';
import type { ApiError } from './api/AuthTypes';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: () => void;
  lastError: ApiError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<ApiError | null>(null);

  useEffect(() => {
    const session = authClient.getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLastError(null);
    setIsSubmitting(true);
    try {
      const response = await authClient.signIn({ username, password });
      const session: UserSession = {
        token: response.token,
        name: username 
      };
      authClient.setSession(session);
      setUser(session);
    } catch (err: any) {
      if (!err.getFieldError) {
        setLastError({
          errorCode: err.name === 'AbortError' ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
          errorMessage: err.name === 'AbortError' 
            ? 'Превышено время ожидания ответа от сервера (10 сек)' 
            : err.message || 'Сервер недоступен. Проверьте подключение.',
          statusCode: 0,
          getFieldError: () => undefined,
          getFieldErrors: () => undefined,
        } as ApiError);
      } else {
        setLastError(err as ApiError);
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (name: string, password: string) => {
    setLastError(null);
    setIsSubmitting(true);
    try {
      await authClient.signUp({ name, password });
    } catch (err: any) {
      if (!err.getFieldError) {
        setLastError({
          errorCode: err.name === 'AbortError' ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
          errorMessage: err.name === 'AbortError' 
            ? 'Превышено время ожидания ответа от сервера (10 сек)' 
            : err.message || 'Сервер недоступен. Проверьте подключение.',
          statusCode: 0,
          getFieldError: () => undefined,
          getFieldErrors: () => undefined,
        } as ApiError);
      } else {
        setLastError(err as ApiError);
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    authClient.clearSession();
    setUser(null);
  };

  const clearError = () => setLastError(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      isSubmitting,
      login, 
      register, 
      logout,
      lastError,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};