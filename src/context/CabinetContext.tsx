import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';
import type { GetProfileResponse, UpdateProfileRequest } from '../api/users/UsersContracts';
import { getIdFromJwt } from '../common/JwtHelper';

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
  const { user, isAuthenticated, getToken, handleUnauthorized } = useAuth();
  const [userData, setUserData] = useState<CabinetUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const mapProfileToUserData = useCallback(
    (response: GetProfileResponse, currentUser: typeof user): CabinetUserData => ({
      name: currentUser?.name || '',
      email: response.profile.email || '',
      birthDate: response.profile.birthdate || '',
      gender: response.profile.gender || '',
      registrationDate: currentUser?.registrationDate || new Date().toISOString(),
    }),
    []
  );

  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const profile = await usersClient.getProfile(token, getIdFromJwt(token));
      setUserData(mapProfileToUserData(profile, user));
    } catch (err) {
      const apiError = err as ApiError;
      if (handleUnauthorized(apiError)) {
        return;
      }

      setUserData({
        name: user.name || '',
        email: '',
        birthDate: '',
        gender: '',
        registrationDate: user.registrationDate || new Date().toISOString(),
      });

      setError(apiError);
      console.error('Failed to load user profile:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getToken, handleUnauthorized, mapProfileToUserData]);

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
      let birthdate: string | null = null;
      if (data.birthDate && data.birthDate.trim() !== '') {
        const date = new Date(data.birthDate);
        if (!isNaN(date.getTime())) {
          birthdate = date.toISOString();
        }
      }

      const updateRequest: UpdateProfileRequest = {
        email: data.email?.trim() ?? null,
        birthdate: birthdate,
        gender: data.gender ?? null,
      };

      const token = getToken();
      await usersClient.updateProfile(token, getIdFromJwt(token), updateRequest);

      setUserData((prev) => 
        prev ? { ...prev, ...data, email: data.email?.trim() ?? prev.email } : null
      );
    } catch (err) {
      const apiError = err as ApiError;
      if (handleUnauthorized(apiError)) {
        return;
      }
      setError(apiError);
      console.error('Failed to update user profile:', apiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CabinetContext.Provider
      value={{
        userData,
        isLoading,
        error,
        updateUserData,
        refreshUserData,
        clearError,
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