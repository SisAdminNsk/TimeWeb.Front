import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { friendsClient } from '../api/friends/FriendsClient';
import { usersClient } from '../api/users/UsersClient';
import type { FriendshipInviteDto, FriendshipDto } from '../api/friends/FriendsContracts';
import type { ApiError } from '../api/ApiError';
import { useAuth } from './AuthContext'

export const PAGE_SIZE = 20;

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface FriendsContextType {
  friends: FriendshipDto[];
  incomingInvites: FriendshipInviteDto[];
  outgoingInvites: FriendshipInviteDto[];
  friendsTotalCount: number;
  incomingTotalCount: number;
  outgoingTotalCount: number;
  friendsPage: number;
  incomingPage: number;
  outgoingPage: number;
  pageSize: number;
  
  isLoading: boolean;
  error: ApiError | null;
  notification: Notification | null;
  
  sendFriendRequest: (username: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  declineOutgoingInvite: (inviteId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  
  refreshFriends: (page?: number) => Promise<void>;
  refreshIncomingInvites: (page?: number) => Promise<void>;
  refreshOutgoingInvites: (page?: number) => Promise<void>;
  refreshInvites: () => Promise<void>;
  
  setFriendsPage: (page: number) => void;
  setIncomingPage: (page: number) => void;
  setOutgoingPage: (page: number) => void;
  clearError: () => void;
  clearNotification: () => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {

  const { executeWithAuth } = useAuth();

  const [friends, setFriends] = useState<FriendshipDto[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<FriendshipInviteDto[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<FriendshipInviteDto[]>([]);
  
  const [friendsTotalCount, setFriendsTotalCount] = useState(0);
  const [incomingTotalCount, setIncomingTotalCount] = useState(0);
  const [outgoingTotalCount, setOutgoingTotalCount] = useState(0);
  
  const [friendsPage, setFriendsPage] = useState(1);
  const [incomingPage, setIncomingPage] = useState(1);
  const [outgoingPage, setOutgoingPage] = useState(1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearNotification = useCallback(() => setNotification(null), []);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const refreshFriends = useCallback(async (page: number = 1) => {
    try {
      const response = await executeWithAuth((token) => friendsClient.getFriends(token, page, PAGE_SIZE));
      setFriends(response.friends);
      setFriendsTotalCount(response.totalCount);
      
      const newTotalPages = Math.ceil(response.totalCount / PAGE_SIZE);
      
      let newPage = page;
      if (newTotalPages === 0) {
        newPage = 1;
      } else if (page > newTotalPages) {
        newPage = newTotalPages;
        const correctedResponse = await executeWithAuth((token) => friendsClient.getFriends(token, newPage, PAGE_SIZE));
        setFriends(correctedResponse.friends);
        setFriendsTotalCount(correctedResponse.totalCount);
      }
      
      setFriendsPage(newPage);
    } catch (err) {
      let apiError = err as ApiError;
      if(apiError.statusCode !== 401) {
        setError(apiError);
      }
    }
  }, [executeWithAuth]);

  const refreshIncomingInvites = useCallback(async (page: number = 1) => {
    try {
      const response = await executeWithAuth((token) => friendsClient.getInvites(token, true, page, PAGE_SIZE));
      setIncomingInvites(response.invites);
      setIncomingTotalCount(response.totalCount);
      
      const newTotalPages = Math.ceil(response.totalCount / PAGE_SIZE);
      
      let newPage = page;
      if (newTotalPages === 0) {
        newPage = 1;
      } else if (page > newTotalPages) {
        newPage = newTotalPages;
        const correctedResponse = await executeWithAuth((token) => friendsClient.getInvites(token, true, newPage, PAGE_SIZE));
        setIncomingInvites(correctedResponse.invites);
        setIncomingTotalCount(correctedResponse.totalCount);
      }
      
      setIncomingPage(newPage);
    } catch (err) {
      let apiError = err as ApiError;
      if(apiError.statusCode !== 401) {
        setError(apiError);
      }
    }
  }, [executeWithAuth]);

  const refreshOutgoingInvites = useCallback(async (page: number = 1) => {
    try {
      const response = await executeWithAuth((token) => friendsClient.getInvites(token, false, page, PAGE_SIZE));
      setOutgoingInvites(response.invites);
      setOutgoingTotalCount(response.totalCount);
      
      const newTotalPages = Math.ceil(response.totalCount / PAGE_SIZE);
      
      let newPage = page;
      if (newTotalPages === 0) {
        newPage = 1;
      } else if (page > newTotalPages) {
        newPage = newTotalPages;
        const correctedResponse = await executeWithAuth((token) => friendsClient.getInvites(token, false, newPage, PAGE_SIZE));
        setOutgoingInvites(correctedResponse.invites);
        setOutgoingTotalCount(correctedResponse.totalCount);
      }
      
      setOutgoingPage(newPage);
    } catch (err) {
      let apiError = err as ApiError;
      if(apiError.statusCode !== 401) {
        setError(apiError);
      }
    }
  }, [executeWithAuth]);

  const refreshInvites = useCallback(async () => {
    await Promise.all([
      refreshIncomingInvites(1),
      refreshOutgoingInvites(1)
    ]);
  }, [refreshIncomingInvites, refreshOutgoingInvites]);

  const sendFriendRequest = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const checkUserExistenceResponse = await executeWithAuth((token) => usersClient.checkUserExistence(token, username));
      const userId = checkUserExistenceResponse.userId;
      await executeWithAuth((token) => friendsClient.sendInvite(token, userId));
      await refreshOutgoingInvites(outgoingPage);
      showNotification('success', 'Заявка отправлена!');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        showNotification('error', 'Пользователь не найден');
      } else if (apiError.statusCode === 400) {
        showNotification('error', apiError.errorMessage || 'Ошибка валидации');
      } else if (apiError.statusCode !== 401) {
        showNotification('error', apiError.errorMessage || 'Ошибка при отправке заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshOutgoingInvites, showNotification, outgoingPage, executeWithAuth]);

  const acceptInvite = useCallback(async (inviteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await executeWithAuth((token) => friendsClient.acceptInvite(token, inviteId));
      await Promise.all([
        refreshFriends(friendsPage), 
        refreshIncomingInvites(incomingPage)
      ]);
      showNotification('success', 'Заявка принята!');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setIncomingInvites(prev => prev.filter(invite => invite.id !== inviteId));
        setIncomingTotalCount(prev => Math.max(0, prev - 1));
        await refreshIncomingInvites(incomingPage);
        showNotification('info', 'Заявки больше не существует');
      } else if (apiError.statusCode !== 401) {
        showNotification('error', apiError.errorMessage || 'Ошибка при принятии заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFriends, refreshIncomingInvites, showNotification, friendsPage, incomingPage, executeWithAuth]);

  const declineInvite = useCallback(async (inviteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await executeWithAuth((token) => friendsClient.declineInvite(token, inviteId));
      await refreshIncomingInvites(incomingPage);
      showNotification('success', 'Заявка отклонена');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setIncomingInvites(prev => prev.filter(invite => invite.id !== inviteId));
        setIncomingTotalCount(prev => Math.max(0, prev - 1));
        await refreshIncomingInvites(incomingPage);
        showNotification('info', 'Заявки больше не существует');
      } else if (apiError.statusCode !== 401) {
        showNotification('error', apiError.errorMessage || 'Ошибка при отклонении заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshIncomingInvites, showNotification, incomingPage, executeWithAuth]);

  const declineOutgoingInvite = useCallback(async (inviteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await executeWithAuth((token) => friendsClient.declineInvite(token, inviteId));
      await refreshOutgoingInvites(outgoingPage);
      showNotification('success', 'Заявка отозвана');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setOutgoingInvites(prev => prev.filter(invite => invite.id !== inviteId));
        setOutgoingTotalCount(prev => Math.max(0, prev - 1));
        await refreshOutgoingInvites(outgoingPage);
        showNotification('info', 'Заявки больше не существует');
      } else if (apiError.statusCode !== 401) {
        showNotification('error', apiError.errorMessage || 'Ошибка при отзыве заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshOutgoingInvites, showNotification, outgoingPage, executeWithAuth]);

  const removeFriend = useCallback(async (friendId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await executeWithAuth((token) => friendsClient.removeFriend(token, friendId));
      await refreshFriends(friendsPage);
      showNotification('success', 'Друг удален');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode !== 401) {
        showNotification('error', apiError.errorMessage || 'Ошибка при удалении друга');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFriends, showNotification, friendsPage, executeWithAuth]);

  return (
    <FriendsContext.Provider value={{
      friends,
      incomingInvites,
      outgoingInvites,
      friendsTotalCount,
      incomingTotalCount,
      outgoingTotalCount,
      friendsPage,
      incomingPage,
      outgoingPage,
      pageSize: PAGE_SIZE,
      isLoading,
      error,
      notification,
      sendFriendRequest,
      acceptInvite,
      declineInvite,
      declineOutgoingInvite,
      removeFriend,
      refreshFriends,
      refreshIncomingInvites,
      refreshOutgoingInvites,
      refreshInvites,
      setFriendsPage,
      setIncomingPage,
      setOutgoingPage,
      clearError,
      clearNotification,
    }}>
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) throw new Error('useFriends must be used within FriendsProvider');
  return context;
};