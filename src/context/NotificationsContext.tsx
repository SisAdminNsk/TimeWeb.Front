import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { eventsClient } from '../api/events/EventsClient';
import type { ReactNode } from 'react';
import type { NotificationDto, SearchNotificationsRequest, SearchNotificationsResponse } from '../api/events/EventsContracts';

export interface NotificationsContextType {
  notifications: NotificationDto[];
  isLoading: boolean; // Статус текущего запроса (в том числе фонового)
  isInitialLoading: boolean; // Статус только первой загрузки
  totalCount: number;
  page: number;
  pageSize: number;
  type: 'NewEvent' | 'EventUpdated' | 'EventDeclined';
  setType: (type: 'NewEvent' | 'EventUpdated' | 'EventDeclined') => void;
  setPage: (page: number) => void;
  refreshNotifications: (type?: 'NewEvent' | 'EventUpdated' | 'EventDeclined', page?: number) => Promise<void>;
  onAccept: (notificationId: string) => Promise<void>;
  onDecline: (notificationId: string) => Promise<void>;
  onDontShowAgain: (notificationId: string, checked: boolean) => Promise<void>;
  newNotificationIds: Set<string>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const PAGE_SIZE = 10;
const NEW_NOTIFICATION_ANIMATION_DURATION = 10000;

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { executeWithAuth } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Новое состояние
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'NewEvent' | 'EventUpdated' | 'EventDeclined'>('NewEvent');
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const newNotificationTimersRef = useRef<Map<string, number>>(new Map());
  const hasLoadedOnce = useRef(false); // Флаг первой загрузки

  const refreshNotifications = useCallback(async (notifType?: 'NewEvent' | 'EventUpdated' | 'EventDeclined', notifPage?: number) => {
    const targetType = notifType ?? type;
    const targetPage = notifPage ?? page;

    setIsLoading(true);
    try {
      const req = {
        eventId: null,
        type: targetType,
        recipientStatus: 'NoReaction' as const,
        pageSize: PAGE_SIZE,
        pageNumber: targetPage,
      } as SearchNotificationsRequest;

      const resp: SearchNotificationsResponse = await executeWithAuth(token => {
        if (!token) {
          throw new Error('Auth token is missing');
        }
        return eventsClient.searchNotifications(token, req);
      });

      if (!resp) {
        setNotifications([]);
        setTotalCount(0);
        return;
      }

      const newIds = new Set<string>();
      resp.notifications.forEach(n => {
        const id = `${n.eventId}-${n.createdAt}`;
        if (!previousNotificationIds.current.has(id)) {
          newIds.add(id);
        }
      });

      if (newIds.size > 0) {
        setNewNotificationIds(prev => {
          const updated = new Set(prev);
          newIds.forEach(id => updated.add(id));
          return updated;
        });

        newIds.forEach(id => {
          const timer = setTimeout(() => {
            setNewNotificationIds(prev => {
              const updated = new Set(prev);
              updated.delete(id);
              return updated;
            });
            newNotificationTimersRef.current.delete(id);
          }, NEW_NOTIFICATION_ANIMATION_DURATION);
          
          newNotificationTimersRef.current.set(id, timer);
        });
      }

      previousNotificationIds.current = new Set(resp.notifications.map(n => `${n.eventId}-${n.createdAt}`));
      
      setNotifications(resp.notifications);
      setTotalCount(resp.totalCount);

      // После первого успешного запроса убираем флаг первоначальной загрузки
      if (!hasLoadedOnce.current) {
        setIsInitialLoading(false);
        hasLoadedOnce.current = true;
      }

    } catch (err) {
      console.error('[Notifications] Ошибка при загрузке:', err);
      // При ошибке тоже считаем, что попытка загрузки была
      if (!hasLoadedOnce.current) {
        setIsInitialLoading(false);
        hasLoadedOnce.current = true;
      }
      setNotifications([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [executeWithAuth, type, page]);

  const onAccept = useCallback(async (notificationId: string) => {
    console.log('[Notifications] Принятие события:', notificationId);
    alert(`Событие ${notificationId} принято (заглушка)`);
  }, []);

  const onDecline = useCallback(async (notificationId: string) => {
    console.log('[Notifications] Отклонение события:', notificationId);
    alert(`Событие ${notificationId} отклонено (заглушка)`);
  }, []);

  const onDontShowAgain = useCallback(async (notificationId: string, checked: boolean) => {
    console.log('[Notifications] "Больше не показывать" для:', notificationId, checked);
    if (checked) {
      alert(`Уведомление ${notificationId} больше не будет показано (заглушка)`);
    }
  }, []);

  useEffect(() => {
    refreshNotifications(type, page);
    
    const interval = setInterval(() => {
      refreshNotifications(type, page);
    }, 10000);

    return () => {
      clearInterval(interval);
      newNotificationTimersRef.current.forEach((timer) => clearTimeout(timer));
      newNotificationTimersRef.current.clear();
    };
  }, [type, page, refreshNotifications]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      isLoading,
      isInitialLoading, // Экспортируем новое поле
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      type,
      setType,
      setPage,
      refreshNotifications,
      onAccept,
      onDecline,
      onDontShowAgain,
      newNotificationIds,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};