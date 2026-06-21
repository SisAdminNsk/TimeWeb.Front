import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { eventsClient } from '../api/events/EventsClient';
import type { ReactNode } from 'react';
import type { 
    NotificationDto, 
    SearchNotificationsRequest, 
    SearchNotificationsResponse,
    DetailedEventDto 
} from '../api/events/EventsContracts';

export interface NotificationsContextType {
  notifications: NotificationDto[];
  isLoading: boolean;
  isInitialLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  type: 'NewEvent' | 'EventUpdated' | 'EventDeclined';
  setType: (type: 'NewEvent' | 'EventUpdated' | 'EventDeclined') => void;
  setPage: (page: number) => void;
  refreshNotifications: (type?: 'NewEvent' | 'EventUpdated' | 'EventDeclined', page?: number) => Promise<void>;
  onAccept: (eventId: string) => Promise<void>;
  onDecline: (eventId: string) => Promise<void>;
  newNotificationIds: Set<string>;
  typeCounts: Record<'NewEvent' | 'EventUpdated' | 'EventDeclined', number>;
  totalNotificationsCount: number;
  fetchEventDetails: (eventId: string, includeDeleted?: boolean) => Promise<DetailedEventDto | null>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const PAGE_SIZE = 10;
const NEW_NOTIFICATION_ANIMATION_DURATION = 10000;
const POLLING_INTERVAL = 10000;

const NOTIFICATION_TYPES = ['NewEvent', 'EventUpdated', 'EventDeclined'] as const;

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { executeWithAuth } = useAuth();
  const { addToast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'NewEvent' | 'EventUpdated' | 'EventDeclined'>('NewEvent');
  
  const [typeCounts, setTypeCounts] = useState<Record<'NewEvent' | 'EventUpdated' | 'EventDeclined', number>>({
    NewEvent: 0,
    EventUpdated: 0,
    EventDeclined: 0,
  });
  
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const previousNotificationsByType = useRef<Record<'NewEvent' | 'EventUpdated' | 'EventDeclined', Set<string>>>({
    NewEvent: new Set(),
    EventUpdated: new Set(),
    EventDeclined: new Set(),
  });
  const newNotificationTimersRef = useRef<Map<string, number>>(new Map());
  
  const hasLoadedOnce = useRef(false);

  const fetchEventDetails = useCallback(async (eventId: string, includeDeleted: boolean = false): Promise<DetailedEventDto | null> => {
    try {
      const eventDetails: DetailedEventDto = await executeWithAuth(token => {
        if (!token) {
          throw new Error('Auth token is missing');
        }
        return eventsClient.getEventDetails(token, eventId, includeDeleted);
      });
      return eventDetails;
    } catch (err) {
      console.error(`[Notifications] Ошибка при получении деталей события ${eventId}:`, err);
      return null;
    }
  }, [executeWithAuth]);

  const fetchCountByType = useCallback(async (notifType: 'NewEvent' | 'EventUpdated' | 'EventDeclined'): Promise<number> => {
    try {
      const req = {
        eventId: null,
        type: notifType,
        recipientStatus: 'NoReaction' as const,
        includeDeleted: notifType === 'EventDeclined' || notifType === 'EventUpdated',
        pageSize: 1,
        pageNumber: 1,
      } as SearchNotificationsRequest;

      const resp: SearchNotificationsResponse = await executeWithAuth(token => {
        if (!token) {
          throw new Error('Auth token is missing');
        }
        return eventsClient.searchNotifications(token, req);
      });

      return resp?.totalCount ?? 0;
    } catch (err) {
      console.error(`[Notifications] Ошибка при получении счетчика для ${notifType}:`, err);
      return 0;
    }
  }, [executeWithAuth]);

  const refreshAllCounts = useCallback(async () => {
    const counts = await Promise.all(
      NOTIFICATION_TYPES.map(async (t) => {
        const count = await fetchCountByType(t);
        return { type: t, count };
      })
    );

    setTypeCounts({
      NewEvent: counts.find(c => c.type === 'NewEvent')?.count ?? 0,
      EventUpdated: counts.find(c => c.type === 'EventUpdated')?.count ?? 0,
      EventDeclined: counts.find(c => c.type === 'EventDeclined')?.count ?? 0,
    });
  }, [fetchCountByType]);

  const refreshNotifications = useCallback(async (
    notifType?: 'NewEvent' | 'EventUpdated' | 'EventDeclined', 
    notifPage?: number,
    isPolling: boolean = false
  ) => {
    const targetType = notifType ?? type;
    const targetPage = notifPage ?? page;

    if (!isPolling) {
      setIsLoading(true);
    }

    try {
      const req = {
        eventId: null,
        type: targetType,
        recipientStatus: 'NoReaction' as const,
        includeDeleted: targetType === 'EventDeclined' || targetType === 'EventUpdated',
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

      const currentIds = new Set<string>();
      const newIds = new Set<string>();

      resp.notifications.forEach(n => {
        const id = `${n.eventId}-${n.createdAt}`;
        currentIds.add(id);
        
        if (hasLoadedOnce.current && !previousNotificationIds.current.has(id)) {
          newIds.add(id);
        }
      });

      if (isPolling && targetPage === 1 && newIds.size > 0) {
        const typeLabels = {
          'NewEvent': 'новая встреча',
          'EventUpdated': 'изменение встречи',
          'EventDeclined': 'отмена встречи',
        };
        
        const label = typeLabels[targetType];
        const message = newIds.size === 1 
          ? `${label}` 
          : `Новых встреч: ${newIds.size}`;

        addToast({
          title: 'Новое уведомление',
          message: message,
          type: 'info',
        });

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

      previousNotificationIds.current = currentIds;
      
      setNotifications(resp.notifications);
      setTotalCount(resp.totalCount);
      setTypeCounts(prev => ({
        ...prev,
        [targetType]: resp.totalCount,
      }));

      if (!hasLoadedOnce.current) {
        setIsInitialLoading(false);
        hasLoadedOnce.current = true;
      }

    } catch (err) {
      console.error('[Notifications] Ошибка при загрузке:', err);
      if (!hasLoadedOnce.current) {
        setIsInitialLoading(false);
        hasLoadedOnce.current = true;
      }
      setNotifications([]);
      setTotalCount(0);
    } finally {
      if (!isPolling) {
        setIsLoading(false);
      }
    }
  }, [executeWithAuth, type, page, addToast]);

  const pollAllNotifications = useCallback(async () => {
    try {
      const typeLabels = {
        'NewEvent': 'новая встреча',
        'EventUpdated': 'изменение встречи',
        'EventDeclined': 'отмена встречи',
      };

      // Получаем уведомления для всех трех типов параллельно
      const results = await Promise.all(
        NOTIFICATION_TYPES.map(async (notifType) => {
          try {
            const req = {
              eventId: null,
              type: notifType,
              recipientStatus: 'NoReaction' as const,
              includeDeleted: notifType === 'EventDeclined' || notifType === 'EventUpdated',
              pageSize: 1,
              pageNumber: 1,
            } as SearchNotificationsRequest;

            const resp: SearchNotificationsResponse = await executeWithAuth(token => {
              if (!token) {
                throw new Error('Auth token is missing');
              }
              return eventsClient.searchNotifications(token, req);
            });

            return { type: notifType, totalCount: resp?.totalCount ?? 0, notifications: resp?.notifications ?? [] };
          } catch (err) {
            console.error(`[Notifications] Ошибка при polling для ${notifType}:`, err);
            return { type: notifType, totalCount: 0, notifications: [] };
          }
        })
      );

      // Обновляем счетчики
      const newTypeCounts = {
        NewEvent: 0,
        EventUpdated: 0,
        EventDeclined: 0,
      };

      // Проверяем каждый тип на новые уведомления
      results.forEach(result => {
        const { type: notifType, totalCount, notifications } = result;
        newTypeCounts[notifType] = totalCount;

        if (hasLoadedOnce.current) {
          const currentIds = new Set<string>();
          const newIds = new Set<string>();

          notifications.forEach(n => {
            const id = `${n.eventId}-${n.createdAt}`;
            currentIds.add(id);
            
            if (!previousNotificationsByType.current[notifType].has(id)) {
              newIds.add(id);
            }
          });

          // Если есть новые уведомления, показываем toast
          if (newIds.size > 0) {
            const label = typeLabels[notifType];
            const message = newIds.size === 1 
              ? `${label}` 
              : `${label}: ${newIds.size}`;

            addToast({
              title: 'Новое уведомление',
              message: message,
              type: 'info',
            });

            console.log(`[Notifications] Новых ${notifType}: ${newIds.size}`);
          }

          // Обновляем предыдущие ID для этого типа
          previousNotificationsByType.current[notifType] = currentIds;
        } else {
          // При первой загрузке просто запоминаем ID
          const currentIds = new Set<string>();
          notifications.forEach(n => {
            const id = `${n.eventId}-${n.createdAt}`;
            currentIds.add(id);
          });
          previousNotificationsByType.current[notifType] = currentIds;
        }
      });

      setTypeCounts(newTypeCounts);

      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      console.error('[Notifications] Ошибка при polling всех типов:', err);
    }
  }, [executeWithAuth, addToast]);

  const onAccept = useCallback(async (eventId: string) => {
    console.log('[Notifications] Принятие события:', eventId);
    
    try {
      await executeWithAuth(token => {
        if (!token) {
          throw new Error('Auth token is missing');
        }
        return eventsClient.acceptEvent(token, eventId);
      });
      
      addToast({
        title: 'Принято',
        message: 'Вы приняли приглашение на встречу',
        type: 'success',
      });
      
      await refreshAllCounts();
      await refreshNotifications(type, page, false);
      await pollAllNotifications();
    } catch (err) {
      console.error('[Notifications] Ошибка при принятии события:', err);
      addToast({
        title: 'Ошибка',
        message: 'Не удалось принять приглашение',
        type: 'error',
      });
      throw err;
    }
  }, [executeWithAuth, addToast, refreshAllCounts, refreshNotifications, type, page, pollAllNotifications]);

  const onDecline = useCallback(async (eventId: string) => {
    console.log('[Notifications] Отклонение события:', eventId);
    
    try {
      await executeWithAuth(token => {
        if (!token) {
          throw new Error('Auth token is missing');
        }
        return eventsClient.declineEvent(token, eventId);
      });
      
      addToast({
        title: 'Отклонено',
        message: 'Вы отклонили приглашение на встречу',
        type: 'warning',
      });
      
      await refreshAllCounts();
      await refreshNotifications(type, page, false);
      await pollAllNotifications();
    } catch (err) {
      console.error('[Notifications] Ошибка при отклонении события:', err);
      addToast({
        title: 'Ошибка',
        message: 'Не удалось отклонить приглашение',
        type: 'error',
      });
      throw err;
    }
  }, [executeWithAuth, addToast, refreshAllCounts, refreshNotifications, type, page, pollAllNotifications]);

  useEffect(() => {
    refreshAllCounts();
  }, [refreshAllCounts]);

  useEffect(() => {
    refreshNotifications(type, page, false);
    
    const interval = setInterval(() => {
      // Polling для всех типов одновременно
      pollAllNotifications();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
      newNotificationTimersRef.current.forEach((timer) => clearTimeout(timer));
      newNotificationTimersRef.current.clear();
    };
  }, [type, page, refreshNotifications, pollAllNotifications]);

  const totalNotificationsCount = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      isLoading,
      isInitialLoading,
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      type,
      setType,
      setPage,
      refreshNotifications,
      onAccept,
      onDecline,
      newNotificationIds,
      typeCounts,
      totalNotificationsCount,
      fetchEventDetails,
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