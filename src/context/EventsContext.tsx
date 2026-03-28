// context/EventsContext.tsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { eventsClient } from '../api/events/EventsClient';
import type { ReactNode } from 'react';
import type { 
  DetailedEventDto, 
  SearchEventsRequest,
  EventDto as ApiEventDto,
  RemoveEventRequest
} from '../api/events/EventsContracts';
import { getIdFromJwt } from '../common/JwtHelper';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  friendIds: string[];
  createdAt: string;
  isInitiator?: boolean; // Флаг: пользователь является организатором
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface EventsContextType {
  events: CalendarEvent[];
  initiatorEvents: CalendarEvent[]; // События где пользователь - организатор
  selectedDate: string | null;
  isLoading: boolean;
  isDetailsLoading: boolean;
  notification: Notification | null;
  selectedEvent: DetailedEventDto | null;
  
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>;
  deleteEvent: (eventId: string, deletedReason?: string | null) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  selectDate: (date: string | null) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  hasEventsOnDate: (date: string) => boolean;
  isEventInitiator: (eventId: string) => boolean;
  clearNotification: () => void;
  
  // Новые методы для API
  fetchEventsForMonth: (year: number, month: number) => Promise<void>;
  fetchInitiatorEventsForMonth: (year: number, month: number) => Promise<void>;
  getEventDetails: (eventId: string, includeDeleted?: boolean) => Promise<DetailedEventDto | null>;
  setSelectedEvent: (event: DetailedEventDto | null) => void;
  refetchEvents: () => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

const convertApiEventToCalendarEvent = (
  apiEvent: ApiEventDto, 
  isInitiator: boolean = false
): CalendarEvent => {
  const startDate = new Date(apiEvent.startAt);
  const endDate = new Date(apiEvent.endAt);
  
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description || '',
    date: startDate.toISOString().substring(0, 10),
    startTime: startDate.toTimeString().substring(0, 5),
    endTime: endDate.toTimeString().substring(0, 5),
    friendIds: apiEvent.members?.map(m => m.id) || [],
    createdAt: apiEvent.createdAt,
    isInitiator,
  };
};

// Вспомогательная функция для получения userId из токена
const getUserIdFromToken = (accessToken: string | null | undefined): string | null => {
  if (!accessToken) return null;
  try {
    return getIdFromJwt(accessToken);
  } catch (err) {
    console.error('Failed to extract user ID from token:', err);
    return null;
  }
};

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { executeWithAuth, user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [initiatorEvents, setInitiatorEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedEvent, setSelectedEventState] = useState<DetailedEventDto | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  // Получаем userId из токена пользователя
  const userId = user ? getUserIdFromToken(user.accessToken) : null;

  // Авто-загрузка событий при монтировании или изменении refetchTrigger
  useEffect(() => {
    if (userId) {
      const now = new Date();
      fetchAllEventsForMonth(now.getFullYear(), now.getMonth());
    }
  }, [refetchTrigger, userId]);

  const clearNotification = useCallback(() => setNotification(null), []);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Загрузка событий где пользователь - участник
  const fetchEventsForMonth = useCallback(async (year: number, month: number) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const request: SearchEventsRequest = {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        memberId: userId,
        status: 'Accepted',
        pageSize: 1000,
        pageNumber: 1
      };

      const response = await executeWithAuth(token =>
        eventsClient.searchEvents(token, request)
      );

      const convertedEvents = (response.events || []).map(event => 
        convertApiEventToCalendarEvent(event, false)
      );
      setEvents(convertedEvents);
    } catch (err) {
      console.error('Failed to fetch events from API:', err);
      showNotification('error', 'Не удалось загрузить события');
    } finally {
      setIsLoading(false);
    }
  }, [userId, executeWithAuth, showNotification]);

  // Загрузка событий где пользователь - организатор (без memberId)
  const fetchInitiatorEventsForMonth = useCallback(async (year: number, month: number) => {
    if (!userId) return;
    
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const request: SearchEventsRequest = {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        memberId: null,
        status: null,
        pageSize: 1000,
        pageNumber: 1
      };

      const response = await executeWithAuth(token =>
        eventsClient.searchEvents(token, request)
      );

      const convertedEvents = (response.events || []).map(event => 
        convertApiEventToCalendarEvent(event, true)
      );
      setInitiatorEvents(convertedEvents);
    } catch (err) {
      console.error('Failed to fetch initiator events from API:', err);
      // Не показываем ошибку пользователю, так как это дополнительная информация
    }
  }, [userId, executeWithAuth, showNotification]);

  // Загрузка всех событий (участник + организатор)
  const fetchAllEventsForMonth = useCallback(async (year: number, month: number) => {
    await Promise.all([
      fetchEventsForMonth(year, month),
      fetchInitiatorEventsForMonth(year, month)
    ]);
  }, [fetchEventsForMonth, fetchInitiatorEventsForMonth]);

  // Получение деталей события
  const getEventDetails = useCallback(async (eventId: string, includeDeleted: boolean = false): Promise<DetailedEventDto | null> => {
    setIsDetailsLoading(true);
    try {
      const details = await executeWithAuth(token =>
        eventsClient.getEventDetails(token, eventId, includeDeleted)
      );
      setSelectedEventState(details);
      return details;
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      showNotification('error', 'Не удалось загрузить детали события');
      return null;
    } finally {
      setIsDetailsLoading(false);
    }
  }, [executeWithAuth, showNotification]);

  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const createEventReq = {
        title: eventData.title,
        description: eventData.description,
        startAt: `${eventData.date}T${eventData.startTime}`,
        endAt: `${eventData.date}T${eventData.endTime}`,
        memberIds: eventData.friendIds,
      };
      const response = await executeWithAuth(token =>
        eventsClient.createEvent(token, createEventReq)
      );
      const newEvent: CalendarEvent = {
        ...eventData,
        id: response.eventId,
        createdAt: new Date().toISOString(),
        isInitiator: true, // Пользователь создал событие
      };
      setEvents(prev => [...prev, newEvent]);
      setInitiatorEvents(prev => [...prev, newEvent]);
      
      // Перезагружаем события месяца
      const eventDate = new Date(eventData.date);
      await fetchAllEventsForMonth(eventDate.getFullYear(), eventDate.getMonth());
    } catch (err) {
      showNotification('error', 'Ошибка при добавлении события');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, executeWithAuth, fetchAllEventsForMonth]);

  const deleteEvent = useCallback(async (eventId: string, deletedReason?: string | null) => {
    setIsLoading(true);
    try {
      const isInitiator = initiatorEvents.some(event => event.id === eventId);
      
      if (!isInitiator) {
        throw new Error('У вас нет прав на удаление этого события. Только организатор может удалять события.');
      }

      await executeWithAuth(async (token) => {
        const removeRequest: RemoveEventRequest = {
          deletedReason: deletedReason || null,
        };
        await eventsClient.removeEvent(token, eventId, removeRequest);
      });
      
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setInitiatorEvents(prev => prev.filter(e => e.id !== eventId));
      
      if (selectedEvent?.eventId === eventId) {
        setSelectedEventState(null);
      }
      
      const now = new Date();
      await fetchAllEventsForMonth(now.getFullYear(), now.getMonth());
      
    } catch (err) {
      console.error('Failed to delete event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении события';
      showNotification('error', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [initiatorEvents, executeWithAuth, selectedEvent, showNotification, fetchAllEventsForMonth]);

  // ЗАГЛУШКА: Обновление события (пока только локально)
  const updateEvent = useCallback(async (eventData: CalendarEvent) => {
    setIsLoading(true);
    try {
      // TODO: Добавить API вызов когда будет готов
      // const updateEventReq = {
      //   title: eventData.title,
      //   description: eventData.description,
      //   startAt: `${eventData.date}T${eventData.startTime}`,
      //   endAt: `${eventData.date}T${eventData.endTime}`,
      //   memberIds: eventData.friendIds,
      // };
      // await executeWithAuth(token => eventsClient.updateEvent(token, eventData.id, updateEventReq));
      
      // Пока только обновляем в локальном состоянии
      setEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
      setInitiatorEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
      showNotification('info', 'Обновление события временно недоступно (заглушка)');
    } catch (err) {
      showNotification('error', 'Ошибка при обновлении события');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const selectDate = useCallback((date: string | null) => {
    setSelectedDate(date);
  }, []);

  // Объединяем события участника и организатора
  const getAllEvents = useCallback(() => {
    // Используем Map для избежания дубликатов по ID
    const eventsMap = new Map<string, CalendarEvent>();
    
    events.forEach(event => eventsMap.set(event.id, event));
    initiatorEvents.forEach(event => eventsMap.set(event.id, { ...event, isInitiator: true }));
    
    return Array.from(eventsMap.values());
  }, [events, initiatorEvents]);

  const getEventsForDate = useCallback((date: string) => {
    return getAllEvents().filter(event => event.date === date);
  }, [getAllEvents]);

  const hasEventsOnDate = useCallback((date: string) => {
    return getAllEvents().some(event => event.date === date);
  }, [getAllEvents]);

  // Проверка является ли пользователь организатором события
  const isEventInitiator = useCallback((eventId: string) => {
    return initiatorEvents.some(event => event.id === eventId);
  }, [initiatorEvents]);

  const refetchEvents = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  const setSelectedEvent = useCallback((event: DetailedEventDto | null) => {
    setSelectedEventState(event);
  }, []);

  return (
    <EventsContext.Provider value={{
      events,
      initiatorEvents,
      selectedDate,
      isLoading,
      isDetailsLoading,
      notification,
      selectedEvent,
      addEvent,
      deleteEvent,
      updateEvent,
      selectDate,
      getEventsForDate,
      hasEventsOnDate,
      isEventInitiator,
      clearNotification,
      fetchEventsForMonth,
      fetchInitiatorEventsForMonth,
      getEventDetails,
      setSelectedEvent,
      refetchEvents,
    }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents must be used within EventsProvider');
  return context;
};