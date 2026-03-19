import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { theme } from '../styles/theme';
import type { NotificationDto } from '../api/events/EventsContracts';

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

// 🔹 Mock-данные для расширенной информации о событии
const getMockEventDetails = (notification: NotificationDto) => {
  const baseDate = new Date(notification.createdAt);
  const startDate = new Date(baseDate);
  startDate.setDate(startDate.getDate() + 3); // Встреча через 3 дня
  startDate.setHours(15, 0, 0, 0); // 15:00

  const endDate = new Date(startDate);
  endDate.setHours(17, 0, 0, 0); // 17:00 (длительность 2 часа)

  return {
    title: `Встреча #${notification.eventId.substring(0, 8)}`,
    description: 'Обсуждение проекта и планирование следующих шагов разработки.',
    organizer: 'Иван Иванов',
    organizerEmail: 'ivan.ivanov@example.com',
    startDate: startDate,
    endDate: endDate,
    participants: [
      { name: 'Иван Иванов', email: 'ivan.ivanov@example.com', status: 'accepted' },
      { name: 'Петр Петров', email: 'petr.petrov@example.com', status: 'pending' },
      { name: 'Анна Сидорова', email: 'anna.sidorova@example.com', status: 'declined' },
    ]
  };
};

interface EventModalProps {
  isOpen: boolean;
  notification: NotificationDto | null;
  onClose: () => void;
  onAccept: (notificationId: string) => Promise<void>;
  onDecline: (notificationId: string) => Promise<void>;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  notification,
  onClose,
  onAccept,
  onDecline,
}) => {
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  if (!isOpen || !notification) return null;

  const details = getMockEventDetails(notification);
  const eventDate = new Date(notification.createdAt);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(`${notification.eventId}-${notification.createdAt}`);
      onClose();
    } catch (err) {
      console.error('Failed to accept:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline(`${notification.eventId}-${notification.createdAt}`);
      onClose();
    } catch (err) {
      console.error('Failed to decline:', err);
    } finally {
      setIsDeclining(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return { bg: colors.successLight, color: colors.successDark, text: 'Принято' };
      case 'declined':
        return { bg: colors.errorLight, color: colors.errorDark, text: 'Отклонено' };
      case 'pending':
      default:
        return { bg: colors.warningLight, color: colors.warningDark, text: 'Ожидает' };
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const sameDay = start.toDateString() === end.toDateString();
    
    const dateStr = start.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
    
    const startTime = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    if (sameDay) {
      return `${dateStr}, ${startTime} - ${endTime}`;
    } else {
      const endDateStr = end.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return `${dateStr}, ${startTime} - ${endDateStr}, ${endTime}`;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease',
        padding: spacing.md,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          boxShadow: shadows.xl,
          padding: spacing.xl,
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideIn 0.2s ease',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.gray900,
            }}>
              {details.title}
            </h3>
            <p style={{
              margin: `${spacing.xs} 0 0 0`,
              fontSize: typography.fontSize.sm,
              color: colors.gray500,
            }}>
              ID: <span style={{ fontFamily: 'monospace', background: colors.gray100, padding: `0 ${spacing.xs}`, borderRadius: borderRadius.sm }}>{notification.eventId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.xs,
              color: colors.gray400,
              fontSize: typography.fontSize.xl,
              lineHeight: 1,
              transition: `color ${transitions.fast}`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.gray600}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.gray400}
          >
            ✕
          </button>
        </div>

        {/* Основная информация */}
        <div style={{ marginBottom: spacing.lg }}>
          {/* 🔹 Дата и время проведения */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.gray50,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.primary}`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray900 }}>
                Дата и время проведения
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.gray700 }}>
                {formatDateRange(details.startDate, details.endDate)}
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.gray500, marginTop: spacing.xs }}>
                Длительность: {Math.round((details.endDate.getTime() - details.startDate.getTime()) / 60000)} мин
              </div>
            </div>
          </div>

          {/* Дата создания уведомления */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.gray50,
            border: `1px solid ${colors.primary}`,
            borderRadius: borderRadius.md,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.gray500} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <div>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray900 }}>
                Дата создания уведомления
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.gray600 }}>
                {eventDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                {eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Организатор */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.gray50,
            border: `1px solid ${colors.primary}`,
            borderRadius: borderRadius.md,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <div>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray900 }}>
                Организатор
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.gray600 }}>
                {details.organizer}
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.gray500 }}>
                {details.organizerEmail}
              </div>
            </div>
          </div>
        </div>

        {/* Описание */}
        <div style={{ marginBottom: spacing.lg }}>
          <h4 style={{
            margin: `0 0 ${spacing.sm} 0`,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
          }}>
            Описание
          </h4>
          <p style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            color: colors.gray600,
            lineHeight: 1.6,
          }}>
            {details.description}
          </p>
        </div>

        {/* Участники */}
        <div style={{ marginBottom: spacing.lg }}>
          <h4 style={{
            margin: `0 0 ${spacing.sm} 0`,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
          }}>
            Участники
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {details.participants.map((participant, index) => {
              const badge = getStatusBadgeStyle(participant.status);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: spacing.sm,
                    backgroundColor: colors.gray50,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900 }}>
                      {participant.name}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.gray500 }}>
                      {participant.email}
                    </div>
                  </div>
                  <span style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: badge.bg,
                    color: badge.color,
                    borderRadius: borderRadius.full,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                  }}>
                    {badge.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Кнопки действий */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          paddingTop: spacing.lg,
          borderTop: `1px solid ${colors.gray200}`,
        }}>
          <button
            onClick={onClose}
            disabled={isAccepting || isDeclining}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.white,
              color: colors.gray700,
              border: `1px solid ${colors.gray300}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: isAccepting || isDeclining ? 'not-allowed' : 'pointer',
              transition: `all ${transitions.normal}`,
              opacity: isAccepting || isDeclining ? 0.6 : 1,
            }}
          >
            Закрыть
          </button>
          <button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.error,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: isAccepting || isDeclining ? 'not-allowed' : 'pointer',
              transition: `all ${transitions.normal}`,
              opacity: isAccepting || isDeclining ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <span>✕</span>
            {isDeclining ? 'Отклонение...' : 'Отклонить'}
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.success,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: isAccepting || isDeclining ? 'not-allowed' : 'pointer',
              transition: `all ${transitions.normal}`,
              opacity: isAccepting || isDeclining ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <span>✓</span>
            {isAccepting ? 'Принятие...' : 'Принять'}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  } = useNotifications();

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  // 🔹 Состояние для модального окна
  const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (notification: NotificationDto) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

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
          {/* Маленький индикатор фоновой загрузки */}
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
                {/* Счетчик для каждой вкладки */}
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

                    <div style={{ 
                      fontSize: typography.fontSize.sm, 
                      color: colors.gray600,
                      marginBottom: spacing.xs,
                    }}>
                      ID новости: <span style={{ fontFamily: 'monospace', background: colors.gray100, padding: `0 ${spacing.xs}`, borderRadius: borderRadius.sm }}>{n.eventId}</span>
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
                          onAccept(notificationId);
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
                          onDecline(notificationId);
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

      {/* 🔹 Модальное окно события */}
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