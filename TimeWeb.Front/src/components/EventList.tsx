import React, { useState } from 'react';
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

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    eventId: string | null;
    eventTitle: string | null;
  }>({
    isOpen: false,
    eventId: null,
    eventTitle: null,
  });

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

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    setDeleteModal({
      isOpen: true,
      eventId,
      eventTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.eventId) {
      try {
        await deleteEvent(deleteModal.eventId);
        setDeleteModal({ isOpen: false, eventId: null, eventTitle: null });
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, eventId: null, eventTitle: null });
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
      marginBottom: spacing.sm,
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

    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    } as React.CSSProperties,
    
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.xl,
      padding: spacing.lg,
      maxWidth: '400px',
      width: '90%',
      animation: 'slideIn 0.2s ease',
    } as React.CSSProperties,
    
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    } as React.CSSProperties,
    
    modalIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: colors.errorLight,
      borderRadius: borderRadius.full,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    
    modalIconSvg: {
      width: '20px',
      height: '20px',
      color: colors.error,
    } as React.CSSProperties,
    
    modalTitle: {
      margin: 0,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    } as React.CSSProperties,
    
    modalMessage: {
      fontSize: typography.fontSize.base,
      color: colors.gray600,
      marginBottom: spacing.lg,
      lineHeight: 1.5,
    } as React.CSSProperties,
    
    modalEventName: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
      backgroundColor: colors.gray100,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.md,
      display: 'inline-block',
      marginTop: spacing.sm,
    } as React.CSSProperties,
    
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    } as React.CSSProperties,
    
    modalButtonCancel: {
      backgroundColor: 'transparent',
      color: colors.gray700,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    } as React.CSSProperties,
    
    modalButtonDelete: {
      backgroundColor: colors.error,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    } as React.CSSProperties,
  };

  if (!selectedDate) {
    return (
      <div style={styles.container}>
        <div style={styles.noDateSelected}>
          <p>Выберите дату в календаре</p>
          <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
            Нажмите на любую дату, чтобы просмотреть или создать встречу
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Встречи</h3>
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
            <p>На этот день нет запланированных встреч</p>
            <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
              Нажмите «Добавить», чтобы создать новую встречу
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
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteClick(event.id, event.title)}
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
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
                
                {event.description && (
                  <p style={styles.eventDescription}>{event.description}</p>
                )}
                
                {event.friendIds.length > 0 && (
                  <div style={styles.eventFriends}>
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

      {/* Модальное окно подтверждения удаления */}
      {deleteModal.isOpen && (
        <div style={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div 
            style={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>
                <svg 
                  style={styles.modalIconSvg}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <h3 style={styles.modalTitle}>Удалить встречу?</h3>
            </div>
            
            <p style={styles.modalMessage}>
              Вы уверены, что хотите удалить эту встречу? Это действие нельзя отменить.
            </p>
            
            {deleteModal.eventTitle && (
              <div style={styles.modalEventName}>
                {deleteModal.eventTitle}
              </div>
            )}
            
            <div style={styles.modalActions}>
              <button
                style={styles.modalButtonCancel}
                onClick={handleDeleteCancel}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.gray100;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Отмена
              </button>
              <button
                style={styles.modalButtonDelete}
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.errorDark;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.error;
                  }
                }}
              >
                {isLoading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Анимации для модального окна */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default EventsList;