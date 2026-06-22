import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import type { NotificationDto } from '../api/events/EventsContracts';
import type { DetailedEventDto } from '../api/events/EventsContracts';

interface EventModalProps {
  isOpen: boolean;
  notification: NotificationDto | null;
  onClose: () => void;
  onAccept: (eventId: string) => Promise<void>;
  onDecline: (eventId: string) => Promise<void>;
  notificationType?: 'NewEvent' | 'EventUpdated' | 'EventDeclined';
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  notification,
  onClose,
  onAccept,
  onDecline,
  notificationType = 'NewEvent',
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = theme;
  const { fetchEventDetails } = useNotifications();
  const { user } = useAuth();
  
  const [eventDetails, setEventDetails] = useState<DetailedEventDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    if (isOpen && notification?.eventId) {
      setIsLoadingDetails(true);
      setEventDetails(null);
      
      // Для вкладки "Отмененные встречи" используем includeDeleted = true
      const includeDeleted = notificationType === 'EventDeclined';
      fetchEventDetails(notification.eventId, includeDeleted)
        .then(data => setEventDetails(data))
        .catch(err => console.error('Failed to load event details:', err))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [isOpen, notification?.eventId, fetchEventDetails, notificationType]);

  if (!isOpen || !notification) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(notification.eventId);
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
      await onDecline(notification.eventId);
      onClose();
    } catch (err) {
      console.error('Failed to decline:', err);
    } finally {
      setIsDeclining(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Accepted':
        return { bg: colors.successLight, color: colors.successDark, text: 'Принято' };
      case 'Declined':
        return { bg: colors.errorLight, color: colors.errorDark, text: 'Отклонено' };
      case 'Pending':
      default:
        return { bg: colors.warningLight, color: colors.warningDark, text: 'Ожидает' };
    }
  };

  // ✅ Проверяем, является ли участник текущим пользователем
  const isCurrentUser = (username: string) => {
    return user && username === user.name;
  };

  // ✅ Формируем список участников с организатором во главе
  const getParticipantsList = () => {
    if (!eventDetails) return [];
    
    const organizer = {
      username: eventDetails.initiator.username,
      status: 'Accepted' as const,
      isOrganizer: true,
      isCurrentUser: isCurrentUser(eventDetails.initiator.username),
    };
    
    const otherMembers = (eventDetails.members || [])
      .filter(m => m.username !== eventDetails.initiator.username)
      .map(m => ({ 
        ...m, 
        isOrganizer: false,
        isCurrentUser: isCurrentUser(m.username),
      }));
    
    return [organizer, ...otherMembers];
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const sameDay = startDate.toDateString() === endDate.toDateString();
    
    const dateStr = startDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
    
    const startTime = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    if (sameDay) {
      return `${dateStr}, ${startTime} - ${endTime}`;
    } else {
      const endDateStr = endDate.toLocaleDateString('ru-RU', {
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
            {isLoadingDetails ? (
              <div style={{
                height: '24px',
                width: '200px',
                backgroundColor: colors.gray200,
                borderRadius: borderRadius.sm,
              }} />
            ) : (
              <h3 style={{
                margin: 0,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.gray900,
              }}>
                {eventDetails?.title || 'Загрузка...'}
              </h3>
            )}
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
            }}
          >
            ✕
          </button>
        </div>

        {/* Основная информация */}
        <div style={{ marginBottom: spacing.lg }}>
          {!isLoadingDetails && eventDetails ? (
            <>
              <div style={{ marginBottom: spacing.md }}>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray900 }}>
                  Дата и время проведения (GMT+7)
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.gray700 }}>
                  {formatDateRange(eventDetails.startAt, eventDetails.endAt)}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              padding: spacing.lg,
              textAlign: 'center',
              color: colors.gray500,
            }}>
              Загрузка детали события...
            </div>
          )}
        </div>

        {/* Описание */}
        {!isLoadingDetails && eventDetails && (
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
              {eventDetails.description || 'Описание отсутствует'}
            </p>
          </div>
        )}

        {/* Участники */}
        {!isLoadingDetails && eventDetails && (
          <div style={{ marginBottom: spacing.lg }}>
            <h4 style={{
              margin: `0 0 ${spacing.sm} 0`,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.gray900,
            }}>
              Участники
            </h4>
            <div>
              {getParticipantsList().map((participant, index) => {
                const badgeStyle = !participant.isOrganizer ? getStatusBadgeStyle(participant.status) : null;
                
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: spacing.sm,
                      marginBottom: spacing.xs,
                      backgroundColor: participant.isOrganizer ? colors.primary + '15' : colors.gray50,
                      borderRadius: borderRadius.md,
                      border: participant.isOrganizer ? `1px solid ${colors.primary}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      {/* Иконка короны для организатора */}
                      {participant.isOrganizer && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.primary} stroke={colors.primary} strokeWidth="2">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                        </svg>
                      )}
                      <div style={{ 
                        fontSize: typography.fontSize.sm, 
                        fontWeight: participant.isOrganizer ? typography.fontWeight.bold : typography.fontWeight.medium, 
                        color: participant.isOrganizer ? colors.primary : colors.gray900 
                      }}>
                        {participant.username}
                        {/* Приписка "(Вы)" для текущего пользователя */}
                        {participant.isCurrentUser && (
                          <span style={{
                            marginLeft: spacing.xs,
                            fontSize: typography.fontSize.xs,
                            color: colors.gray500,
                            fontWeight: typography.fontWeight.normal,
                          }}>
                            (Вы)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {/* Бейдж "Организатор" для организатора */}
                      {participant.isOrganizer && (
                        <span style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.primary,
                          color: colors.white,
                          borderRadius: borderRadius.full,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                        }}>
                          Организатор
                        </span>
                      )}
                      {/* Бейдж статуса для остальных участников */}
                      {!participant.isOrganizer && badgeStyle && (
                        <span style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          borderRadius: borderRadius.full,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                        }}>
                          {badgeStyle.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Информация об удалении - ТОЛЬКО для вкладки "Отменные встречи" */}
        {notificationType === 'EventDeclined' && !isLoadingDetails && eventDetails && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.lg,
            flexWrap: 'wrap',
          }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: colors.gray200,
              color: colors.gray700,
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

        {/* Кнопки */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          paddingTop: spacing.lg,
          borderTop: `1px solid ${colors.gray200}`,
        }}>
          <button
            onClick={onClose}
            disabled={isAccepting || isDeclining || isLoadingDetails}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.white,
              color: colors.gray700,
              border: `1px solid ${colors.gray300}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: isAccepting || isDeclining || isLoadingDetails ? 'not-allowed' : 'pointer',
              opacity: isAccepting || isDeclining || isLoadingDetails ? 0.6 : 1,
            }}
          >
            Закрыть
          </button>
          {notificationType !== 'EventDeclined' && (
            <>
              <button
                onClick={handleDecline}
                disabled={isAccepting || isDeclining || isLoadingDetails}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: colors.error,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: isAccepting || isDeclining || isLoadingDetails ? 'not-allowed' : 'pointer',
                  opacity: isAccepting || isDeclining || isLoadingDetails ? 0.6 : 1,
                }}
              >
                {isDeclining ? 'Отклонение...' : 'Отклонить'}
              </button>
              <button
                onClick={handleAccept}
                disabled={isAccepting || isDeclining || isLoadingDetails}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: colors.success,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: isAccepting || isDeclining || isLoadingDetails ? 'not-allowed' : 'pointer',
                  opacity: isAccepting || isDeclining || isLoadingDetails ? 0.6 : 1,
                }}
              >
                {isAccepting ? 'Принятие...' : 'Принять'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;