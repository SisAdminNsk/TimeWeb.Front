import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';
import { getIdFromJwt } from '../common/JwtHelper';
import type { 
  BindEmailRequest, BindEmailResponse, 
  EndBindEmailRequest, EndBindEmailResponse 
} from '../api/users/UsersContracts';

export interface UserInfo {
  id: string;
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string | null;
  emailChangedDate: string | null;
  passwordChangedDate: string | null;
  registrationDate: string;
}

export interface AuthContext {
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
  bindEmail: (request: BindEmailRequest) => Promise<BindEmailResponse>;
  endBindEmail: (request: EndBindEmailRequest) => Promise<EndBindEmailResponse>;
  updateUserEmail: (newEmail: string, emailChangedDate: string) => void;
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

  // === ОБНОВЛЕНИЕ ПОЧТЫ В КОНТЕКСТЕ ===
  const updateUserEmail = useCallback((newEmail: string, emailChangedDate: string): void => {
    const current = getSession();
    if (current) {
      const updated: UserInfo = {
        ...current,
        email: newEmail,
        emailChangedDate,
      };
      saveSession(updated);
    }
  }, [getSession, saveSession]);

  const logout = useCallback(async (reason: 'unauthorized' | 'user' = 'user') => {
    if (logoutPromise.current) return logoutPromise.current;

    logoutPromise.current = (async () => {
      const session = getSession();
      
      if (session?.accessToken) {
        try {
          await usersClient.logoutMe(session.accessToken);
        } catch (error: any) {
          if (error?.statusCode === 401 && session?.refreshToken) {
            try {
              const refreshResponse = await usersClient.refresh({ token: session.refreshToken });
              try {
                await usersClient.logoutMe(refreshResponse.accessToken);
              } catch { /* ignore */ }
            } catch { /* ignore */ }
          }
        }
      }

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
    if (!session?.accessToken) throw new Error('User not authenticated: no token available');
    return session.accessToken;
  }, [getSession]);

  const refreshTokens = useCallback(async (): Promise<void> => {
    if (refreshPromise.current) return refreshPromise.current;

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
      const getUserResponse = await usersClient.getUser(accessToken, getIdFromJwt(accessToken));

      const session: UserInfo = {
        id: signInResponse.userId,
        accessToken: signInResponse.accessToken,
        refreshToken: signInResponse.refreshToken,
        name: username,
        email: getUserResponse.user.email,
        emailChangedDate: getUserResponse.user.emailChangedDate,
        passwordChangedDate: getUserResponse.user.passwordChangedDate,
        registrationDate: getUserResponse.user.createdAt
      };
      saveSession(session);
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
      await usersClient.signUp({ name, password });
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

  const bindEmail = useCallback(async (request: BindEmailRequest): Promise<BindEmailResponse> => {
    const token = getToken();
    return await usersClient.bindEmail(token, request);
  }, [getToken]);

  const endBindEmail = useCallback(async (request: EndBindEmailRequest): Promise<EndBindEmailResponse> => {
    const token = getToken();
    return await usersClient.endBindEmail(token, request);
  }, [getToken]);


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
        // === Новые методы ===
        bindEmail,
        endBindEmail,
        updateUserEmail,
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