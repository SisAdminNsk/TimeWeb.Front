import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { friendsClient } from './api/friends/FriendsClient';
import { usersClient } from './api/users/UsersClient';
import type { FriendshipInviteDto, FriendshipDto } from './api/friends/FriendsContracts';
import type { ApiError } from './api/ApiError';

export const PAGE_SIZE = 5;

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
  refreshInvites: () => Promise<void>;
  
  setFriendsPage: (page: number) => void;
  clearError: () => void;
  clearNotification: () => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<FriendshipDto[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<FriendshipInviteDto[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<FriendshipInviteDto[]>([]);
  
  const [friendsTotalCount, setFriendsTotalCount] = useState(0);
  const [incomingTotalCount, setIncomingTotalCount] = useState(0);
  const [outgoingTotalCount, setOutgoingTotalCount] = useState(0);
  
  const [friendsPage, setFriendsPage] = useState(1);
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
      // Сначала запрашиваем данные для указанной страницы
      const response = await friendsClient.getFriends(page, PAGE_SIZE);
      setFriends(response.friends);
      setFriendsTotalCount(response.totalCount);
      
      // Вычисляем актуальное количество страниц
      const newTotalPages = Math.ceil(response.totalCount / PAGE_SIZE);
      
      // Исправленная логика:
      // 1. Если страниц нет вообще (0 друзей) — сбрасываем на 1
      // 2. Если запрошенная страница больше доступных — загружаем последнюю страницу
      // 3. Иначе остаёмся на запрошенной странице
      let newPage = page;
      if (newTotalPages === 0) {
        newPage = 1;
      } else if (page > newTotalPages) {
        // Запрашиваем данные для корректной страницы
        newPage = newTotalPages;
        const correctedResponse = await friendsClient.getFriends(newPage, PAGE_SIZE);
        setFriends(correctedResponse.friends);
        setFriendsTotalCount(correctedResponse.totalCount);
      }
      
      setFriendsPage(newPage);
    } catch (err) {
      setError(err as ApiError);
    }
  }, []);

  const refreshInvites = useCallback(async () => {
    try {
      const [incoming, outgoing] = await Promise.all([
        friendsClient.getInvites(true, 1, 20),
        friendsClient.getInvites(false, 1, 20),
      ]);
      setIncomingInvites(incoming.invites);
      setOutgoingInvites(outgoing.invites);
      setIncomingTotalCount(incoming.totalCount);
      setOutgoingTotalCount(outgoing.totalCount);
    } catch (err) {
      setError(err as ApiError);
    }
  }, []);

  const sendFriendRequest = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const checkUserExistenceResponse = await usersClient.checkUserExistence(username);
      const userId = checkUserExistenceResponse.userId;
      await friendsClient.sendInvite(userId);
      await refreshInvites();
      showNotification('success', 'Заявка отправлена!');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        showNotification('error', 'Пользователь не найден');
      } else if (apiError.statusCode === 400) {
        showNotification('error', apiError.errorMessage || 'Ошибка валидации');
      } else {
        showNotification('error', apiError.errorMessage || 'Ошибка при отправке заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshInvites, showNotification]);

  const acceptInvite = useCallback(async (inviteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await friendsClient.acceptInvite(inviteId);
      await Promise.all([refreshFriends(friendsPage), refreshInvites()]);
      showNotification('success', 'Заявка принята!');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setIncomingInvites(prev => prev.filter(invite => invite.id !== inviteId));
        setIncomingTotalCount(prev => Math.max(0, prev - 1));
        showNotification('info', 'Заявки больше не существует');
      } else {
        showNotification('error', apiError.errorMessage || 'Ошибка при принятии заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFriends, refreshInvites, showNotification, friendsPage]);

  const declineInvite = useCallback(async (inviteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await friendsClient.declineInvite(inviteId);
      await refreshInvites();
      showNotification('success', 'Заявка отклонена');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setIncomingInvites(prev => prev.filter(invite => invite.id !== inviteId));
        setIncomingTotalCount(prev => Math.max(0, prev - 1));
        showNotification('info', 'Заявки больше не существует');
      } else {
        showNotification('error', apiError.errorMessage || 'Ошибка при отклонении заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshInvites, showNotification]);

  const declineOutgoingInvite = useCallback(async (inviteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await friendsClient.declineInvite(inviteId);
      await refreshInvites();
      showNotification('success', 'Заявка отозвана');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setOutgoingInvites(prev => prev.filter(invite => invite.id !== inviteId));
        setOutgoingTotalCount(prev => Math.max(0, prev - 1));
        showNotification('info', 'Заявки больше не существует');
      } else {
        showNotification('error', apiError.errorMessage || 'Ошибка при отзыве заявки');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshInvites, showNotification]);

  const removeFriend = useCallback(async (friendId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await friendsClient.removeFriend(friendId);
      // refreshFriends сам проверит и скорректирует страницу если нужно
      await refreshFriends(friendsPage);
      showNotification('success', 'Друг удален');
    } catch (err) {
      const apiError = err as ApiError;
      showNotification('error', apiError.errorMessage || 'Ошибка при удалении друга');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFriends, showNotification, friendsPage]);

  return (
    <FriendsContext.Provider value={{
      friends,
      incomingInvites,
      outgoingInvites,
      friendsTotalCount,
      incomingTotalCount,
      outgoingTotalCount,
      friendsPage,
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
      refreshInvites,
      setFriendsPage,
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