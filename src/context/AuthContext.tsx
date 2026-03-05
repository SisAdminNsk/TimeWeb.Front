import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';
import { getIdFromJwt } from '../common/JwtHelper'

interface UserInfo {
  accessToken: string;
  refreshToken: string;
  name: string;
  registrationDate: string;
}

interface AuthContext {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: (reason?: 'unauthorized' | 'user') => Promise<void>;
  getToken: () => string;
  executeWithAuth: <T>(action: (token: string) => Promise<T>) => Promise<T>;
  handleUnauthorized: (error: ApiError) => boolean;
  lastError: ApiError | null;
  clearError: () => void;
}

const userSession = 'user_session';
const AuthContext = createContext<AuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<ApiError | null>(null);
  
  const refreshPromise = useRef<Promise<void> | null>(null);
  // Ref для предотвращения параллельных вызовов logout
  const logoutPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const getSession = useCallback((): UserInfo | null => {
    const data = localStorage.getItem(userSession);
    return data ? JSON.parse(data) : null;
  }, []);

  const saveSession = useCallback((session: UserInfo): void => {
    localStorage.setItem(userSession, JSON.stringify(session));
    setUser(session);
  }, []);

  const clearSession = useCallback((): void => {
    localStorage.removeItem(userSession);
    setUser(null);
  }, []);

  const logout = useCallback(async (reason: 'unauthorized' | 'user' = 'user') => {
    // Если уже идет процесс logout, ждем его
    if (logoutPromise.current) {
      return logoutPromise.current;
    }

    logoutPromise.current = (async () => {
      const session = getSession();
      
      // Пытаемся сделать logout через API
      if (session?.accessToken) {
        try {
          await usersClient.logoutMe(session.accessToken);
        } catch (error: any) {
          // Если получили 401, пробуем refresh и повторяем logout
          if (error?.statusCode === 401 && session?.refreshToken) {
            try {
              // Пробуем получить новые токены
              const refreshResponse = await usersClient.refresh({ token: session.refreshToken });
              
              // Пытаемся logout с новым токеном
              try {
                await usersClient.logoutMe(refreshResponse.accessToken);
              } catch (logoutError) {
                // Второй logout тоже не удался - игнорируем, всё равно выходим
                console.warn('Logout after refresh failed:', logoutError);
              }
            } catch (refreshError) {
              // Refresh не удался - игнорируем, всё равно выходим
              console.warn('Refresh during logout failed:', refreshError);
            }
          } else {
            // Другая ошибка (не 401) - игнорируем, всё равно выходим
            console.warn('Logout API call failed:', error);
          }
        }
      }

      // Всегда очищаем сессию независимо от результата API вызовов
      clearSession();
      setUser(null);
      refreshPromise.current = null;
      logoutPromise.current = null;
      
      if (reason === 'unauthorized') {
        navigate('/sign-in', {
          state: { message: 'Токен авторизации невалиден. Войдите снова.' },
        });
      }
    })();

    return logoutPromise.current;
  }, [navigate, clearSession, getSession]);

  const getToken = useCallback((): string => {
    const session = getSession();
    if (!session?.accessToken) {
      throw new Error('User not authenticated: no token available');
    }
    return session.accessToken;
  }, [getSession]);

  const refreshTokens = useCallback(async (): Promise<void> => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    const session = getSession();
    if (!session?.refreshToken) {
      await logout('unauthorized');
      throw new Error('No refresh token available');
    }

    refreshPromise.current = (async () => {
      try {
        const response = await usersClient.refresh({ token: session.refreshToken });
        const newSession: UserInfo = {
          ...session,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        };
        
        saveSession(newSession);
      } catch (error) {
        await logout('unauthorized');
        throw error;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [getSession, saveSession, logout]);

  const executeWithAuth = useCallback(async <T,>(action: (token: string) => Promise<T>): Promise<T> => {
    const token = getToken();
    try {
      return await action(token);
    } catch (error: any) {
      if (error?.statusCode === 401) {
        try {
          await refreshTokens();
          const newToken = getToken();
          return await action(newToken);
        } catch (refreshError) {
          throw refreshError;
        }
      }
      throw error;
    }
  }, [getToken, refreshTokens]);

  const login = async (username: string, password: string) => {
    setLastError(null);
    setIsSubmitting(true);
    try {
      const signInResponse = await usersClient.signIn({ username, password });
      const accessToken = signInResponse.accessToken;
      const getUserResponse = await usersClient.getUser(accessToken, getIdFromJwt(accessToken))

      const session: UserInfo = {
        accessToken: signInResponse.accessToken,
        refreshToken: signInResponse.refreshToken,
        name: username,
        registrationDate: getUserResponse.user.createdAt
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

  const clearError = useCallback(() => setLastError(null), []);

  const handleUnauthorized = useCallback((error: ApiError): boolean => {
    if (error.statusCode === 401) {
      logout('unauthorized');
      return true;
    }
    return false;
  }, [logout]);

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
        executeWithAuth,
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