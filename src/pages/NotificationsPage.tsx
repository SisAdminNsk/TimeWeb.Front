import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { theme } from '../styles/theme';
import type { NotificationDto } from '../api/events/EventsContracts';
import type { DetailedEventDto } from '../api/events/EventsContracts';
import EventModal from '../components/EventModal';

const tabTypes = [
  { key: 'NewEvent', label: 'Новые встречи' },
  { key: 'EventUpdated', label: 'Изменения по встречам' },
  { key: 'EventDeclined', label: 'Отмененные встречи' },
];

const blinkKeyframes = `
@keyframes blinkDot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.9);
  }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    isLoading,
    isInitialLoading,
    totalCount,
    page,
    pageSize,
    type,
    setType,
    setPage,
    onAccept,
    onDecline,
    newNotificationIds,
    typeCounts,
    fetchEventDetails,
  } = useNotifications();
  
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventDetailsCache, setEventDetailsCache] = useState<Record<string, DetailedEventDto>>({});

  const handleCardClick = (notification: NotificationDto) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  useEffect(() => {
    const loadEventDetails = async () => {
      const newCache = { ...eventDetailsCache };
      for (const notification of notifications) {
        if (!newCache[notification.eventId]) {
          try {
            const details = await fetchEventDetails(notification.eventId);
            if (details) {
              newCache[notification.eventId] = details;
            }
          } catch (err) {
            console.error(`Failed to load details for event ${notification.eventId}:`, err);
          }
        }
      }
      setEventDetailsCache(newCache);
    };
    
    if (notifications.length > 0) {
      loadEventDetails();
    }
  }, [notifications, fetchEventDetails]);

  return (
    <>
      <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
        <style>{blinkKeyframes}</style>
        
        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.gray900,
            margin: 0
          }}>
            Новости по встречам
          </h2>
          {isLoading && !isInitialLoading && (
            <div style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${colors.gray200}`,
              borderTop: `2px solid ${colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </div>

        {/* Табы навигации */}
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, flexWrap: 'wrap' }}>
          {tabTypes.map(tab => {
            const isActive = type === tab.key;
            const count = typeCounts[tab.key as keyof typeof typeCounts];
            return (
              <button
                key={tab.key}
                onClick={() => setType(tab.key as typeof type)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  background: isActive ? colors.primary : colors.white,
                  color: isActive ? colors.white : colors.gray700,
                  border: `1px solid ${isActive ? colors.primary : colors.gray300}`,
                  borderRadius: borderRadius.md,
                  fontWeight: typography.fontWeight.medium,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  boxShadow: isActive ? shadows.md : 'none',
                  transition: `all ${transitions.normal}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = colors.gray50;
                    e.currentTarget.style.borderColor = colors.gray400;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = colors.white;
                    e.currentTarget.style.borderColor = colors.gray300;
                  }
                }}
              >
                {tab.label}
                <span style={{
                  minWidth: '20px',
                  height: '20px',
                  padding: `0 ${spacing.xs}`,
                  backgroundColor: count > 0 ? (isActive ? colors.white : colors.primary) : colors.gray300,
                  color: count > 0 ? (isActive ? colors.primary : colors.white) : colors.gray600,
                  borderRadius: borderRadius.full,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all ${transitions.fast}`,
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Список уведомлений */}
        <div>
          {isInitialLoading ? (
            <div style={{
              padding: spacing['2xl'],
              textAlign: 'center',
              color: colors.gray500,
              background: colors.gray50,
              borderRadius: borderRadius.lg,
            }}>
              <div style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.sm }}>Загрузка...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              padding: spacing['2xl'],
              textAlign: 'center',
              color: colors.gray500,
              background: colors.gray50,
              borderRadius: borderRadius.lg,
              border: `1px dashed ${colors.gray300}`
            }}>
              <div style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.sm }}>Нет уведомлений</div>
              <div style={{ fontSize: typography.fontSize.sm }}>Попробуйте выбрать другой фильтр</div>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map(n => {
                const notificationId = `${n.eventId}-${n.createdAt}`;
                const isNew = newNotificationIds.has(notificationId);
                const eventDetails = eventDetailsCache[n.eventId];
                
                return (
                  <li
                    key={notificationId}
                    onClick={() => handleCardClick(n)}
                    style={{
                      marginBottom: spacing.md,
                      background: colors.white,
                      padding: spacing.lg,
                      borderRadius: borderRadius.lg,
                      border: `1px solid ${colors.gray200}`,
                      boxShadow: shadows.sm,
                      transition: `all ${transitions.normal}`,
                      position: 'relative',
                      opacity: isLoading ? 0.9 : 1,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = shadows.md;
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = shadows.sm;
                      e.currentTarget.style.borderColor = colors.gray200;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isNew && (
                      <div style={{
                        position: 'absolute',
                        top: spacing.md,
                        right: spacing.md,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: colors.success,
                        animation: 'blinkDot 2s ease-in-out infinite',
                        boxShadow: `0 0 4px ${colors.success}`,
                      }} />
                    )}
                    
                    {/* 🔹 Заголовок события */}
                    <div style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.gray900,
                      marginBottom: spacing.xs,
                    }}>
                      {eventDetails ? (
                        eventDetails.title
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          width: '150px',
                          height: '20px',
                          backgroundColor: colors.gray200,
                          borderRadius: borderRadius.sm,
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                      )}
                    </div>
                    
                    {/* 🔹 Автор события (организатор) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      fontSize: typography.fontSize.sm,
                      color: colors.gray600,
                      marginBottom: spacing.xs,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gray500} strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>
                        {eventDetails ? (
                          eventDetails.initiator.username
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            width: '80px',
                            height: '14px',
                            backgroundColor: colors.gray200,
                            borderRadius: borderRadius.sm,
                          }} />
                        )}
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.gray500,
                      marginBottom: spacing.lg,
                    }}>
                      Получено: {new Date(n.createdAt).toLocaleString()}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      flexWrap: 'wrap',
                      paddingTop: spacing.md,
                      borderTop: `1px solid ${colors.gray100}`,
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAccept(n.eventId);
                        }}
                        style={{
                          padding: `${spacing.xs} ${spacing.md}`,
                          background: colors.success,
                          color: colors.white,
                          border: 'none',
                          borderRadius: borderRadius.md,
                          fontWeight: typography.fontWeight.medium,
                          fontSize: typography.fontSize.sm,
                          cursor: 'pointer',
                          transition: `all ${transitions.fast}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.successDark}
                        onMouseLeave={(e) => e.currentTarget.style.background = colors.success}
                      >
                        <span>✓</span> Принять
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDecline(n.eventId);
                        }}
                        style={{
                          padding: `${spacing.xs} ${spacing.md}`,
                          background: colors.error,
                          color: colors.white,
                          border: 'none',
                          borderRadius: borderRadius.md,
                          fontWeight: typography.fontWeight.medium,
                          fontSize: typography.fontSize.sm,
                          cursor: 'pointer',
                          transition: `all ${transitions.fast}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.errorDark}
                        onMouseLeave={(e) => e.currentTarget.style.background = colors.error}
                      >
                        <span>✕</span> Отклонить
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Пагинация */}
        {totalCount > pageSize && (
          <div style={{
            marginTop: spacing.xl,
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.xs,
            flexWrap: 'wrap'
          }}>
            {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = page === pageNum;
              return (
                <button
                  key={pageNum}
                  style={{
                    minWidth: '40px',
                    height: '40px',
                    padding: `${spacing.xs} ${spacing.sm}`,
                    background: isActive ? colors.primary : colors.white,
                    color: isActive ? colors.white : colors.gray700,
                    border: `1px solid ${isActive ? colors.primary : colors.gray300}`,
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    fontWeight: typography.fontWeight.medium,
                    fontSize: typography.fontSize.sm,
                    transition: `all ${transitions.fast}`,
                  }}
                  onClick={() => setPage(pageNum)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = colors.gray50;
                      e.currentTarget.style.borderColor = colors.gray400;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = colors.white;
                      e.currentTarget.style.borderColor = colors.gray300;
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Модальное окно события */}
      <EventModal
        isOpen={isModalOpen}
        notification={selectedNotification}
        onClose={handleCloseModal}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    </>
  );
};

export default NotificationsPage;