import React, { useState, useEffect } from 'react';
import { EventsProvider, useEvents } from '../context/EventsContext';
import { FriendsProvider } from '../context/FriendsContext';
import { CalendarWidget } from '../components/CalendarWidget';
import { EventsList } from '../components/EventList';
import { AddEventModal } from '../components/AddEventModal';
import { theme } from '../styles/theme';

const EventsPageContent = () => {
  const { selectedDate, selectDate, notification, clearNotification } = useEvents();
  const { colors, typography, spacing, borderRadius } = theme;
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle: React.CSSProperties = {
    animation: 'fadeIn 0.4s ease-out',
    padding: isMobile ? spacing.md : 0,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: isMobile ? spacing.md : spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? typography.fontSize.xl : typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  };

  const subtitleStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '400px 1fr',
    gap: isMobile ? spacing.md : spacing.lg,
    alignItems: 'start',
  };

  const notificationStyle = (type: 'success' | 'error' | 'info'): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: type === 'success' ? colors.successLight 
      : type === 'error' ? colors.errorLight 
      : colors.infoLight,
    color: type === 'success' ? colors.successDark 
      : type === 'error' ? colors.errorDark 
      : colors.infoDark,
    border: `1px solid ${type === 'success' ? colors.success 
      : type === 'error' ? colors.error 
      : colors.info}`,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          <span>Календарь встреч</span>
        </h1>
        <p style={subtitleStyle}>
          Планируйте встречи и приглашайте друзей
        </p>
      </header>

      {notification && (
        <div style={notificationStyle(notification.type)}>
          <span style={{ flex: isMobile ? '1 1 100%' : 'auto' }}>
            {notification.type === 'success' && '✓ '}
            {notification.type === 'error' && '⚠️ '}
            {notification.type === 'info' && 'ℹ️ '}
            {notification.message}
          </span>
          <button
            onClick={clearNotification}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '18px', 
              padding: isMobile ? '8px' : '0 4px', 
              color: 'inherit',
              outline: 'none',
              minWidth: '32px',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Закрыть уведомление"
          >
            ✕
          </button>
        </div>
      )}

      <div style={gridStyle}>
        <CalendarWidget 
          onDateSelect={selectDate}
          selectedDate={selectedDate}
        />
        <EventsList 
          selectedDate={selectedDate}
          onAddEvent={() => setIsModalOpen(true)}
        />
      </div>

      {selectedDate && (
        <AddEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export const EventsPage = () => {
  return (
    <FriendsProvider>
      <EventsProvider>
        <EventsPageContent />
      </EventsProvider>
    </FriendsProvider>
  );
};

export default EventsPage;