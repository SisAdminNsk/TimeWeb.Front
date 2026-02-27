import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';

interface UserSession {
  token: string;
  name: string;
}

interface AuthContext {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: (reason?: 'unauthorized' | 'user') => void;
  getToken: () => string;
  handleUnauthorized: (error: ApiError) => boolean;
  lastError: ApiError | null;
  clearError: () => void;
}

const userSession = 'user_session';
const AuthContext = createContext<AuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<ApiError | null>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLastError(null);
    setIsSubmitting(true);
    try {
      const response = await usersClient.signIn({ username, password });
      const session: UserSession = {
        token: response.token,
        name: username,
      };
      saveSession(session);
      setUser(session);
    } catch (err: any) {
      if (!err.getFieldError) {
        setLastError({
          errorCode: err.name === 'AbortError' ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
          errorMessage:
            err.name === 'AbortError'
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
      await usersClient.signUp({ name, password });
    } catch (err: any) {
      if (!err.getFieldError) {
        setLastError({
          errorCode: err.name === 'AbortError' ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
          errorMessage:
            err.name === 'AbortError'
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

  const logout = (reason: 'unauthorized' | 'user' = 'user') => {
    clearSession();
    setUser(null);
    if (reason === 'unauthorized') {
      navigate('/sign-in', {
        state: { message: 'Токен авторизации невалиден. Войдите снова.' },
      });
    }
  };

  const clearError = () => setLastError(null);

  const getSession = (): UserSession | null => {
    const data = localStorage.getItem(userSession);
    return data ? JSON.parse(data) : null;
  };

  const saveSession = (session: UserSession): void => {
    localStorage.setItem(userSession, JSON.stringify(session));
    setUser(session);
  };

  const clearSession = (): void => {
    localStorage.removeItem(userSession);
    setUser(null);
  };

  const getToken = (): string => {
    const session = getSession();
    if (!session?.token) {
      throw new Error('User not authenticated: no token available');
    }
    return session.token;
  };

  const handleUnauthorized = (error: ApiError): boolean => {
    if (error.statusCode === 401) {
      logout('unauthorized');
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSubmitting,
        login,
        register,
        logout,
        getToken,
        handleUnauthorized,
        lastError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};