import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { eventsClient } from '../api/events/EventsClient';
import type { ReactNode } from 'react';
import type { 
  DetailedEventDto, 
  SearchEventsRequest,
  EventDto as ApiEventDto,
  RemoveEventRequest,
  CreateEventRequest
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
  isInitiator?: boolean;
  needChat?: boolean;
  chatId?: string | null;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface EventsContextType {
  events: CalendarEvent[];
  initiatorEvents: CalendarEvent[];
  selectedDate: string | null;
  isLoading: boolean;
  isDetailsLoading: boolean;
  notification: Notification | null;
  selectedEvent: DetailedEventDto | null;
  
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'> & { needChat?: boolean }) => Promise<void>;
  deleteEvent: (eventId: string, deletedReason?: string | null) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  selectDate: (date: string | null) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  hasEventsOnDate: (date: string) => boolean;
  isEventInitiator: (eventId: string) => boolean;
  removeMember: (eventId: string, memberId: string) => Promise<void>;
  addMemberToEvent: (eventId: string, memberId: string) => Promise<void>; // 🆕
  clearNotification: () => void;
  
  fetchEventsForMonth: (year: number, month: number) => Promise<void>;
  fetchInitiatorEventsForMonth: (year: number, month: number) => Promise<void>;
  getEventDetails: (eventId: string, includeDeleted?: boolean) => Promise<DetailedEventDto | null>;
  setSelectedEvent: (event: DetailedEventDto | null) => void;
  refetchEvents: () => void;
  
  getFriendEventsForDate: (friendId: string, date: string) => Promise<CalendarEvent[]>;
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
    chatId: apiEvent.chatId ?? null,
    needChat: apiEvent.chatId !== null,
  };
};

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

  const userId = user ? getUserIdFromToken(user.accessToken) : null;

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
    } finally {
      setIsLoading(false);
    }
  }, [userId, executeWithAuth, showNotification]);

  const fetchAllEventsForMonth = useCallback(async (year: number, month: number) => {
    await Promise.all([
      fetchEventsForMonth(year, month),
      fetchInitiatorEventsForMonth(year, month)
    ]);
  }, [fetchEventsForMonth, fetchInitiatorEventsForMonth]);

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

  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'> & { needChat?: boolean }) => {
    setIsLoading(true);
    
    try {
      const createEventReq: CreateEventRequest = {
        title: eventData.title,
        description: eventData.description,
        startAt: `${eventData.date}T${eventData.startTime}`,
        endAt: `${eventData.date}T${eventData.endTime}`,
        memberIds: eventData.friendIds,
        needChat: eventData.needChat ?? false,
      };
      
      const response = await executeWithAuth(token =>
        eventsClient.createEvent(token, createEventReq)
      );
      
      const newEvent: CalendarEvent = {
        ...eventData,
        id: response.eventId,
        createdAt: new Date().toISOString(),
        isInitiator: true,
        chatId: response.chatId ?? null,
        needChat: eventData.needChat ?? false,
      };
      
      setEvents(prev => [...prev, newEvent]);
      setInitiatorEvents(prev => [...prev, newEvent]);
      
      const eventDate = new Date(eventData.date);
      await fetchAllEventsForMonth(eventDate.getFullYear(), eventDate.getMonth());
      
      if (eventData.needChat && response.chatId) {
        showNotification('success', 'Встреча и чат созданы');
      } else {
        showNotification('success', 'Встреча создана');
      }
      
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

  const updateEvent = useCallback(async (eventData: CalendarEvent) => {
    setIsLoading(true);
    try {
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

  const getAllEvents = useCallback(() => {
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

  const isEventInitiator = useCallback((eventId: string) => {
    return initiatorEvents.some(event => event.id === eventId);
  }, [initiatorEvents]);

  const refetchEvents = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  const setSelectedEvent = useCallback((event: DetailedEventDto | null) => {
    setSelectedEventState(event);
  }, []);

  const getFriendEventsForDate = useCallback(async (friendId: string, date: string): Promise<CalendarEvent[]> => {
    if (!userId) return [];
    
    try {
      const targetDate = new Date(date);
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

      const request: SearchEventsRequest = {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        memberId: friendId,
        status: 'Accepted',
        pageSize: 100,
        pageNumber: 1
      };

      const response = await executeWithAuth(token =>
        eventsClient.searchEvents(token, request)
      );

      return (response.events || []).map(event => 
        convertApiEventToCalendarEvent(event, false)
      );
    } catch (err) {
      console.error('Failed to fetch friend events:', err);
      return [];
    }
  }, [userId, executeWithAuth]);

  const removeMember = useCallback(async (eventId: string, memberId: string): Promise<void> => {
    try {
      await executeWithAuth(token =>
        eventsClient.removeMember(token, eventId, memberId)
      );
      showNotification('success', 'Участник успешно удалён');
      
      if (selectedEvent?.eventId === eventId) {
        await getEventDetails(eventId);
      }
      
      refetchEvents();
    } catch (err) {
      console.error('Failed to remove member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении участника';
      showNotification('error', errorMessage);
      throw err;
    }
  }, [executeWithAuth, showNotification, selectedEvent, getEventDetails, refetchEvents]);

  // 🆕 Метод для добавления участника в событие (отправка приглашения)
  const addMemberToEvent = useCallback(async (eventId: string, memberId: string): Promise<void> => {
    try {
      await executeWithAuth(token =>
        eventsClient.addMember(token, eventId, memberId)
      );
      showNotification('success', 'Приглашение отправлено');
      
      // 🔄 Обновляем детали события, если они открыты
      if (selectedEvent?.eventId === eventId) {
        await getEventDetails(eventId);
      }
      
      // Триггерим рефетч событий для обновления списков
      refetchEvents();
    } catch (err) {
      console.error('Failed to add member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при добавлении участника';
      showNotification('error', errorMessage);
      throw err;
    }
  }, [executeWithAuth, showNotification, selectedEvent, getEventDetails, refetchEvents]);

  return (
    <EventsContext.Provider value={{
      events,
      initiatorEvents,
      selectedDate,
      isLoading,
      isDetailsLoading,
      notification,
      selectedEvent,
      removeMember,
      addMemberToEvent, // 🆕
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
      getFriendEventsForDate,
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