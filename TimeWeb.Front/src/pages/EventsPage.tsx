import React, { useState } from 'react';
import { EventsProvider, useEvents } from '../components/EventsContext';
import { FriendsProvider } from '../components/FriendsContext';
import { CalendarWidget } from '../components/CalendarWidget';
import { EventsList } from '../components/EventList';
import { AddEventModal } from '../components/AddEventModal';
import { theme } from '../styles/theme';

const EventsPageContent = () => {
  const { selectedDate, selectDate, notification, clearNotification } = useEvents();
  const { colors, typography, spacing, borderRadius } = theme;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerStyle: React.CSSProperties = {
    animation: 'fadeIn 0.4s ease-out',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: spacing.lg,
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
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          <span></span>
        </h1>
        <p style={subtitleStyle}>
          Планируйте встречи и приглашайте друзей
        </p>
      </header>

      {notification && (
        <div style={notificationStyle(notification.type)}>
          
          <span>
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
              fontSize: '16px', 
              padding: '0 4px', 
              color: 'inherit',
              outline: 'none'
            }}
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