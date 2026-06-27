import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { theme } from '../styles/theme';
import type { NotificationDto } from '../api/events/EventsContracts';
import type { DetailedEventDto } from '../api/events/EventsContracts';
import EventModal from '../components/EventModal';

const tabTypes = [
  { key: 'NewEvent', label: 'Новые встречи' },
  { key: 'EventDeclined', label: 'Отмененные встречи' },
    { key: 'EventUpdated', label: 'Изменения по встречам' }
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
    // 🔹 Не открываем модальное окно для событий, где пользователя исключили
    if (type === 'EventUpdated') {
      return;
    }
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
      // Для EventDeclined и EventUpdated загружаем с includeDeleted = true
      const includeDeleted = type === 'EventDeclined' || type === 'EventUpdated';
      
      for (const notification of notifications) {
        if (!newCache[notification.eventId]) {
          try {
            const details = await fetchEventDetails(notification.eventId, includeDeleted);
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
  }, [notifications, fetchEventDetails, type]);

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
                
                // 🔹 Определяем, можно ли кликать по карточке
                const isClickable = type !== 'EventUpdated';
                
                return (
                  <li
                    key={notificationId}
                    onClick={() => isClickable && handleCardClick(n)}
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
                      cursor: isClickable ? 'pointer' : 'default', // 🔹 Меняем курсор для некликабельных
                    }}
                    onMouseEnter={(e) => {
                      // 🔹 Не применяем ховер-эффекты для некликабельных карточек
                      if (!isClickable) return;
                      e.currentTarget.style.boxShadow = shadows.md;
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isClickable) return;
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
                      marginBottom: spacing.sm,
                    }}>
                      Получено: {new Date(n.createdAt).toLocaleString()}
                    </div>

                    {/* Дата и время проведения встречи */}
                    {eventDetails && (
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.gray600,
                        marginBottom: spacing.md,
                        paddingBottom: spacing.md,
                        borderBottom: `1px solid ${colors.gray100}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gray500} strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>
                            {new Date(eventDetails.startAt).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gray500} strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            {new Date(eventDetails.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(eventDetails.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} 
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Описание события */}
                    {eventDetails?.description && (
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.gray700,
                        marginBottom: spacing.md,
                        paddingBottom: spacing.md,
                        borderBottom: `1px solid ${colors.gray100}`,
                        lineHeight: 1.5,
                      }}>
                        <div style={{ fontWeight: typography.fontWeight.medium, marginBottom: spacing.xs }}>
                          Описание:
                        </div>
                        {eventDetails.description}
                      </div>
                    )}

                    {/* 🔹 ТОЛЬКО для вкладки "Отмененные встречи" - информация об удалении */}
                    {type === 'EventDeclined' && eventDetails && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        marginTop: spacing.md,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: colors.error,
                          color: colors.white,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.full,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                        }}>
                          Отменена
                        </span>
                        {eventDetails.deletedReason && (
                          <span style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.gray600,
                          }}>
                            • {eventDetails.deletedReason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 🔹 ТОЛЬКО для вкладки "Изменения по событиям" - информация об исключении */}
                    {type === 'EventUpdated' && eventDetails && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        marginTop: spacing.md,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: colors.warning,
                          color: colors.gray900,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.full,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                        }}>
                          Вы исключены
                        </span>
                        <span style={{
                          fontSize: typography.fontSize.xs,
                          color: colors.gray600,
                        }}>
                          • Вас больше нет в списке участников этого события
                        </span>
                      </div>
                    )}
                    
                    {/* 🔹 Кнопки действия - ТОЛЬКО для "Новые встречи" */}
                    {type === 'NewEvent' && (
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
                    )}
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
        notificationType={type}
      />
    </>
  );
};

export default NotificationsPage;