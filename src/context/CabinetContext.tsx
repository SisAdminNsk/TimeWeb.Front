import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usersClient } from '../api/users/UsersClient';
import type { ApiError } from '../api/ApiError';
import type { 
  GetProfileResponse, 
  UpdateProfileRequest
} from '../api/users/UsersContracts';
import { PROFILE_ATTRIBUTES } from '../api/users/UsersContracts'
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
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const userId = getIdFromJwt(token);
      const profile = await usersClient.getProfile(token, userId);
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

      const token = getToken();
      const userId = getIdFromJwt(token);
      await usersClient.updateProfile(token, userId, updateRequest);

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