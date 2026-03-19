import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { theme } from '../styles/theme';
import type { NotificationDto } from '../api/events/EventsContracts';
import type { DetailedEventDto } from '../api/events/EventsContracts';

interface EventModalProps {
  isOpen: boolean;
  notification: NotificationDto | null;
  onClose: () => void;
  onAccept: (eventId: string) => Promise<void>;
  onDecline: (eventId: string) => Promise<void>;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  notification,
  onClose,
  onAccept,
  onDecline,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = theme;
  const { fetchEventDetails } = useNotifications();
  
  const [eventDetails, setEventDetails] = useState<DetailedEventDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    if (isOpen && notification?.eventId) {
      setIsLoadingDetails(true);
      setEventDetails(null);
      
      fetchEventDetails(notification.eventId)
        .then(data => setEventDetails(data))
        .catch(err => console.error('Failed to load event details:', err))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [isOpen, notification?.eventId, fetchEventDetails]);

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
      case 'Decliend':
        return { bg: colors.errorLight, color: colors.errorDark, text: 'Отклонено' };
      case 'Pending':
      default:
        return { bg: colors.warningLight, color: colors.warningDark, text: 'Ожидает' };
    }
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
          {isLoadingDetails ? (
            <>
              <div style={{ height: '80px', backgroundColor: colors.gray100, borderRadius: borderRadius.md, marginBottom: spacing.md }} />
              <div style={{ height: '80px', backgroundColor: colors.gray100, borderRadius: borderRadius.md, marginBottom: spacing.md }} />
              <div style={{ height: '80px', backgroundColor: colors.gray100, borderRadius: borderRadius.md }} />
            </>
          ) : eventDetails ? (
            <>
              {/* Дата и время */}
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
                    {formatDateRange(eventDetails.startAt, eventDetails.endAt)}
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
                    {eventDetails.initiator.username}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              padding: spacing.lg,
              textAlign: 'center',
              color: colors.error,
              backgroundColor: colors.errorLight,
              borderRadius: borderRadius.md,
            }}>
              Не удалось загрузить детали события
            </div>
          )}
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
            {isLoadingDetails ? 'Загрузка...' : eventDetails?.description || 'Описание отсутствует'}
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
            {isLoadingDetails ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: '50px', backgroundColor: colors.gray100, borderRadius: borderRadius.md }} />
              ))
            ) : (
              eventDetails?.members.map((member, index) => {
                const badge = getStatusBadgeStyle(member.status);
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
                        {member.username}
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
              })
            )}
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
};

export default EventModal;