import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  friendIds: string[];
  createdAt: string;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface EventsContextType {
  events: CalendarEvent[];
  selectedDate: string | null;
  isLoading: boolean;
  notification: Notification | null;
  
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  selectDate: (date: string | null) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  hasEventsOnDate: (date: string) => boolean;
  clearNotification: () => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Загрузка событий из localStorage при монтировании
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
  }, []);

  // Сохранение событий в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const clearNotification = useCallback(() => setNotification(null), []);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      // Имитация API вызова
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newEvent: CalendarEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      
      setEvents(prev => [...prev, newEvent]);
      showNotification('success', 'Событие успешно добавлено!');
    } catch (err) {
      showNotification('error', 'Ошибка при добавлении события');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const deleteEvent = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setEvents(prev => prev.filter(e => e.id !== eventId));
      showNotification('success', 'Событие удалено');
    } catch (err) {
      showNotification('error', 'Ошибка при удалении события');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const updateEvent = useCallback(async (eventData: CalendarEvent) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
      showNotification('success', 'Событие обновлено');
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

  const getEventsForDate = useCallback((date: string) => {
    return events.filter(event => event.date === date);
  }, [events]);

  const hasEventsOnDate = useCallback((date: string) => {
    return events.some(event => event.date === date);
  }, [events]);

  return (
    <EventsContext.Provider value={{
      events,
      selectedDate,
      isLoading,
      notification,
      addEvent,
      deleteEvent,
      updateEvent,
      selectDate,
      getEventsForDate,
      hasEventsOnDate,
      clearNotification,
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