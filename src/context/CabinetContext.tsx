import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';
import type {
  GetProfileResponse,
  UpdateProfileRequest,
  GetLoginsResponse,
  ChangePasswordRequest,
} from '../api/users/UsersContracts';
import { PROFILE_ATTRIBUTES } from '../api/users/UsersContracts';
import { getIdFromJwt, getLoginIdFromJwt } from '../common/JwtHelper';

export interface CabinetUserData {
  name: string;
  email: string;
  birthDate: string;
  gender: string;
  registrationDate: string;
}

interface CabinetContextType {
  userData: CabinetUserData | null;
  isLoading: boolean;
  error: ApiError | null;
  updateUserData: (data: Partial<CabinetUserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
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

const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || email.trim() === '') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const CabinetProvider: React.FC<CabinetProviderProps> = ({ children }) => {
  const { user, isAuthenticated, executeWithAuth } = useAuth();
  const [userData, setUserData] = useState<CabinetUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [currentLoginId, setCurrentLoginId] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const mapProfileToUserData = useCallback(
    (response: GetProfileResponse, currentUser: typeof user): CabinetUserData => {
      const attributes = response.profile.attributes || {};
      return {
        name: currentUser?.name || '',
        email: attributes[PROFILE_ATTRIBUTES.Email] || '',
        birthDate: attributes[PROFILE_ATTRIBUTES.Birthdate] || '',
        gender: attributes[PROFILE_ATTRIBUTES.Gender] || '',
        registrationDate: currentUser?.registrationDate || new Date().toISOString(),
      };
    },
    []
  );

  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUserData(null);
      setCurrentLoginId(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const profile = await executeWithAuth((token) => {
        const loginId = getLoginIdFromJwt(token);
        setCurrentLoginId(loginId);
        const userId = getIdFromJwt(token);
        return usersClient.getProfile(token, userId);
      });
      setUserData(mapProfileToUserData(profile, user));
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode !== 401) {
        setUserData({
          name: user.name || '',
          email: '',
          birthDate: '',
          gender: '',
          registrationDate: user.registrationDate || new Date().toISOString(),
        });
        setError(apiError);
        console.error('Failed to load user profile:', apiError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, executeWithAuth, mapProfileToUserData]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const updateUserData = async (data: Partial<CabinetUserData>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    if (data.email !== undefined && data.email !== null) {
      if (data.email.trim() === '') {
        throw new Error('Email не может быть пустым');
      }
      if (!isValidEmail(data.email)) {
        throw new Error('Некорректный формат email адреса');
      }
    }
    setIsLoading(true);
    setError(null);
    try {
      const profileAttributes: Record<string, string> = {};
      if (data.email !== undefined) {
        profileAttributes[PROFILE_ATTRIBUTES.Email] = data.email?.trim() ?? '';
      }
      if (data.birthDate !== undefined) {
        if (data.birthDate && data.birthDate.trim() !== '') {
          const date = new Date(data.birthDate);
          if (!isNaN(date.getTime())) {
            profileAttributes[PROFILE_ATTRIBUTES.Birthdate] = date.toISOString();
          } else {
            profileAttributes[PROFILE_ATTRIBUTES.Birthdate] = '';
          }
        } else {
          profileAttributes[PROFILE_ATTRIBUTES.Birthdate] = '';
        }
      }
      if (data.gender !== undefined) {
        profileAttributes[PROFILE_ATTRIBUTES.Gender] = data.gender ?? '';
      }
      const updateRequest: UpdateProfileRequest = {
        profileAttributes,
      };
      await executeWithAuth((token) => {
        const userId = getIdFromJwt(token);
        return usersClient.updateProfile(token, userId, updateRequest);
      });
      setUserData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...data,
          email: data.email !== undefined ? data.email.trim() : prev.email,
          birthDate: data.birthDate !== undefined ? data.birthDate : prev.birthDate,
          gender: data.gender !== undefined ? data.gender : prev.gender,
        };
      });
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode !== 401) {
        setError(apiError);
        console.error('Failed to update user profile:', apiError);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string
    ): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Все поля должны быть заполнены');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Новые пароли не совпадают');
      }

      if (newPassword.length < 8) {
        throw new Error('Пароль должен содержать минимум 8 символов');
      }

      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Пароль должен содержать заглавную букву');
      }

      if (!/[a-z]/.test(newPassword)) {
        throw new Error('Пароль должен содержать строчную букву');
      }

      if (!/[0-9]/.test(newPassword)) {
        throw new Error('Пароль должен содержать цифру');
      }

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
        
        // Обработка специфических ошибок от сервера
        if (apiError.statusCode === 403) {
          if (apiError.errorCode === 'BadCredentials') {
            throw new Error('Неверный текущий пароль');
          }
          if (apiError.errorCode === 'CooldownPeriod') {
            throw new Error('Смена пароля доступна не чаще чем раз в 12 часов');
          }
        }
        
        if (apiError.statusCode === 400) {
          throw new Error(apiError.errorMessage || 'Некорректный новый пароль');
        }
        
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
      if (!user) {
        throw new Error('User not authenticated');
      }
      try {
        const response = await executeWithAuth((token) => {
          return usersClient.getLogins(token, pageSize, pageNumber, isLogout);
        });
        return response;
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.statusCode !== 401) {
          setError(apiError);
          console.error('Failed to load user sessions:', apiError);
        }
        throw err;
      }
    },
    [user, executeWithAuth]
  );

  const terminateSession = useCallback(
    async (loginId: string): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      try {
        await executeWithAuth((token) => {
          return usersClient.logout(token, loginId);
        });
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.statusCode !== 401) {
          setError(apiError);
          console.error('Failed to terminate session:', apiError);
        }
        throw err;
      }
    },
    [user, executeWithAuth]
  );

  return (
    <CabinetContext.Provider
      value={{
        userData,
        isLoading,
        error,
        updateUserData,
        refreshUserData,
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