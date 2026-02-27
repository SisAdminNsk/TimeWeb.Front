import React from 'react';
import { useEvents } from './EventsContext';
import { useFriends } from './FriendsContext';
import { theme } from '../styles/theme';

interface EventsListProps {
  selectedDate: string | null;
  onAddEvent: () => void;
}

export const EventsList: React.FC<EventsListProps> = ({ 
  selectedDate, 
  onAddEvent 
}) => {
  const { getEventsForDate, deleteEvent, isLoading } = useEvents();
  const { friends } = useFriends();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  const events = selectedDate ? getEventsForDate(selectedDate) : [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const getFriendNames = (friendIds: string[]) => {
    return friendIds
      .map(id => {
        const friend = friends.find(f => f.friendId === id);
        return friend ? `Друг (${friend.friendId?.substring(0, 6)}...)` : null;
      })
      .filter(Boolean);
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      try {
        await deleteEvent(eventId);
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const styles = {
    container: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.md,
      padding: spacing.lg,
      width: '100%',
      minHeight: '300px',
    } as React.CSSProperties,
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingBottom: spacing.md,
      borderBottom: `1px solid ${colors.gray200}`,
    } as React.CSSProperties,
    
    title: {
      margin: 0,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    } as React.CSSProperties,
    
    addButton: {
      backgroundColor: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
    } as React.CSSProperties,
    
    dateTitle: {
      fontSize: typography.fontSize.base,
      color: colors.gray600,
      marginBottom: spacing.md,
      fontStyle: 'italic',
    } as React.CSSProperties,
    
    emptyState: {
      textAlign: 'center' as const,
      padding: spacing['2xl'],
      color: colors.gray400,
    } as React.CSSProperties,
    
    emptyIcon: {
      fontSize: '48px',
      marginBottom: spacing.md,
    } as React.CSSProperties,
    
    eventCard: {
      backgroundColor: colors.gray50,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      border: `1px solid ${colors.gray200}`,
      transition: `all ${transitions.normal}`,
    } as React.CSSProperties,
    
    eventHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    } as React.CSSProperties,
    
    eventTitle: {
      margin: 0,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    } as React.CSSProperties,
    
    eventTime: {
      fontSize: typography.fontSize.xs,
      color: colors.primary,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: colors.primaryLight + '20',
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      display: 'inline-block',
    } as React.CSSProperties,
    
    eventDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.gray600,
      marginBottom: spacing.sm,
      lineHeight: 1.5,
    } as React.CSSProperties,
    
    eventFriends: {
      fontSize: typography.fontSize.xs,
      color: colors.gray500,
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
    } as React.CSSProperties,
    
    friendBadge: {
      backgroundColor: colors.gray200,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      color: colors.gray700,
    } as React.CSSProperties,
    
    deleteButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: colors.error,
      cursor: 'pointer',
      fontSize: typography.fontSize.lg,
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      transition: `all ${transitions.fast}`,
      opacity: 0.7,
    } as React.CSSProperties,
    
    noDateSelected: {
      textAlign: 'center' as const,
      padding: spacing['2xl'],
      color: colors.gray400,
    } as React.CSSProperties,
  };

  if (!selectedDate) {
    return (
      <div style={styles.container}>
        <div style={styles.noDateSelected}>
          <div style={styles.emptyIcon}>📅</div>
          <p>Выберите дату в календаре</p>
          <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
            Нажмите на любую дату, чтобы просмотреть или добавить события
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>📋 События</h3>
          <p style={styles.dateTitle}>{formatDate(selectedDate)}</p>
        </div>
        <button
          style={styles.addButton}
          onClick={onAddEvent}
          disabled={isLoading}
          onMouseOver={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = colors.primaryDark;
          }}
          onMouseOut={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          <span>+</span>
          Добавить
        </button>
      </div>
      
      {events.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <p>На этот день нет событий</p>
          <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
            Нажмите «Добавить», чтобы создать новое событие
          </p>
        </div>
      ) : (
        <div>
          {events.map(event => (
            <div key={event.id} style={styles.eventCard}>
              <div style={styles.eventHeader}>
                <div>
                  <h4 style={styles.eventTitle}>{event.title}</h4>
                  <span style={styles.eventTime}>
                    🕐 {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                </div>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(event.id)}
                  disabled={isLoading}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.backgroundColor = colors.errorLight;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  title="Удалить событие"
                >
                  🗑️
                </button>
              </div>
              
              {event.description && (
                <p style={styles.eventDescription}>{event.description}</p>
              )}
              
              {event.friendIds.length > 0 && (
                <div style={styles.eventFriends}>
                  <span>👥</span>
                  {getFriendNames(event.friendIds).map((name, idx) => (
                    <span key={idx} style={styles.friendBadge}>{name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList;