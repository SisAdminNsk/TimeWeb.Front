import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';
import type {
  GetLoginsResponse,
  ChangePasswordRequest,
} from '../api/users/UsersContracts';
import { getLoginIdFromJwt } from '../common/JwtHelper';

export interface CabinetUserData {
  name: string;
  email: string;
  birthDate: string;
  gender: string;
  registrationDate: string;
}

interface CabinetContextType {
  isLoading: boolean;
  error: ApiError | null;
  clearError: () => void;
  getUserSessions: (
    pageSize?: number,
    pageNumber?: number,
    isLogout?: boolean
  ) => Promise<GetLoginsResponse>;
  terminateSession: (loginId: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
  currentLoginId: string | null;
}

const CabinetContext = createContext<CabinetContextType | undefined>(undefined);

interface CabinetProviderProps {
  children: ReactNode;
}

export const CabinetProvider: React.FC<CabinetProviderProps> = ({ children }) => {
  const { user, executeWithAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [currentLoginId, setCurrentLoginId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.accessToken) {
      const loginId = getLoginIdFromJwt(user.accessToken);
      setCurrentLoginId(loginId);
    }
  }, [user?.accessToken]);

  const clearError = useCallback(() => setError(null), []);

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string
    ): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      if (!currentPassword || !newPassword || !confirmPassword) throw new Error('Все поля должны быть заполнены');
      if (newPassword !== confirmPassword) throw new Error('Новые пароли не совпадают');
      if (newPassword.length < 8) throw new Error('Пароль должен содержать минимум 8 символов');
      if (!/[A-Z]/.test(newPassword)) throw new Error('Пароль должен содержать заглавную букву');
      if (!/[a-z]/.test(newPassword)) throw new Error('Пароль должен содержать строчную букву');
      if (!/[0-9]/.test(newPassword)) throw new Error('Пароль должен содержать цифру');

      try {
        await executeWithAuth((token) => {
          const request: ChangePasswordRequest = {
            oldPassword: currentPassword,
            newPassword,
          };
          return usersClient.changePassword(token, request);
        });
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.statusCode === 403) {
          if (apiError.errorCode === 'BadCredentials') throw new Error('Неверный текущий пароль');
          if (apiError.errorCode === 'CooldownPeriod') throw new Error('Смена пароля доступна не чаще чем раз в 12 часов');
        }
        if (apiError.statusCode === 400) throw new Error(apiError.errorMessage || 'Некорректный новый пароль');
        if (apiError.statusCode !== 401) {
          setError(apiError);
          console.error('Failed to change password:', apiError);
        }
        throw err;
      }
    },
    [user, executeWithAuth]
  );

  const getUserSessions = useCallback(
    async (
      pageSize: number = 20,
      pageNumber: number = 1,
      isLogout: boolean = false
    ): Promise<GetLoginsResponse> => {
      if (!user) throw new Error('User not authenticated');
      try {
        setIsLoading(true);
        return await executeWithAuth((token) => usersClient.getLogins(token, pageSize, pageNumber, isLogout));
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.statusCode !== 401) {
          setError(apiError);
          console.error('Failed to load user sessions:', apiError);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, executeWithAuth]
  );

  const terminateSession = useCallback(
    async (loginId: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      try {
        setIsLoading(true);
        await executeWithAuth((token) => usersClient.logout(token, loginId));
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.statusCode !== 401) {
          setError(apiError);
          console.error('Failed to terminate session:', apiError);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, executeWithAuth]
  );

  return (
    <CabinetContext.Provider
      value={{
        isLoading,
        error,
        clearError,
        getUserSessions,
        terminateSession,
        changePassword,
        currentLoginId,
      }}
    >
      {children}
    </CabinetContext.Provider>
  );
};

export const useCabinet = () => {
  const context = useContext(CabinetContext);
  if (context === undefined) {
    throw new Error('useCabinet must be used within a CabinetProvider');
  }
  return context;
};

export default CabinetContext;