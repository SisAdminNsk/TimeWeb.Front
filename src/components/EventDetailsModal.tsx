import React, { useState, useEffect } from 'react';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import type { DetailedEventDto } from '../api/events/EventsContracts';
import ChatWindow from './ChatWindow';

interface EventDetailsModalProps {
  isOpen: boolean;
  eventId: string | null;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  eventId,
  onClose,
}) => {
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  const { getEventDetails } = useEvents();
  const { user } = useAuth();
  
  const [eventDetails, setEventDetails] = useState<DetailedEventDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      setIsLoadingDetails(true);
      setEventDetails(null);
      
      getEventDetails(eventId)
        .then(data => setEventDetails(data))
        .catch(err => console.error('Failed to load event details:', err))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [isOpen, eventId, getEventDetails]);

  useEffect(() => {
    if (!isOpen) {
      setIsChatOpen(false);
    }
  }, [isOpen]);

  if (!isOpen || !eventId) return null;

  const isCurrentUser = (username: string) => {
    return user && username === user.name;
  };

  // 🆕 Получаем ID чата из eventDetails.chatId
  const getChatId = (): string | null => {
    return eventDetails?.chatId ?? null;
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

  // Проверка: пользователь является участником события
  const isParticipant = eventDetails && (
    eventDetails.initiator.username === user?.name ||
    eventDetails.members?.some(m => m.username === user?.name)
  );

  // 🆕 Проверка: есть ли чат у этого события
  const hasChat = eventDetails?.chatId !== null && eventDetails?.chatId !== undefined;

  // Если чат открыт - рендерим только чат
  if (isChatOpen) {
    const chatId = getChatId();
    if (!chatId) {
      setIsChatOpen(false);
      return null;
    }
    
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
            maxWidth: '500px',
            width: '100%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ChatWindow
            chatId={chatId}
            onClose={() => setIsChatOpen(false)}
            currentUsername={user?.name || ''}
          />
        </div>
      </div>
    );
  }

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
          overflowY: 'auto' as const,
          animation: 'slideIn 0.2s ease',
          position: 'relative' as const,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <div>
            {isLoadingDetails ? (
              <div style={{
                height: '24px',
                width: '200px',
                backgroundColor: colors.gray200,
                borderRadius: borderRadius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <h3 style={{
                  margin: 0,
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.gray900,
                }}>
                  {eventDetails?.title || 'Загрузка...'}
                </h3>
                {/* 🆕 Индикатор наличия чата */}
                {hasChat && (
                  <span style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: colors.primary + '20',
                    color: colors.primary,
                    borderRadius: borderRadius.full,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Есть чат
                  </span>
                )}
              </div>
            )}
            <p style={{
              margin: `${spacing.xs} 0 0 0`,
              fontSize: typography.fontSize.sm,
              color: colors.gray500,
            }}>
              ID: <span style={{ fontFamily: 'monospace', background: colors.gray100, padding: `0 ${spacing.xs}`, borderRadius: borderRadius.sm }}>{eventId}</span>
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
              transition: `all ${transitions.fast}`,
            }}
            onMouseOver={(e) => e.currentTarget.style.color = colors.gray600}
            onMouseOut={(e) => e.currentTarget.style.color = colors.gray400}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          {isLoadingDetails ? (
            <>
              <div style={{ height: '80px', backgroundColor: colors.gray100, borderRadius: borderRadius.md, marginBottom: spacing.md, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '80px', backgroundColor: colors.gray100, borderRadius: borderRadius.md, marginBottom: spacing.md, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '80px', backgroundColor: colors.gray100, borderRadius: borderRadius.md, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </>
          ) : eventDetails ? (
            <>
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
            </>
          ) : (
            <div style={{
              padding: spacing.lg,
              textAlign: 'center' as const,
              color: colors.error,
              backgroundColor: colors.errorLight,
              borderRadius: borderRadius.md,
            }}>
              Не удалось загрузить детали события
            </div>
          )}
        </div>

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

        <div style={{ marginBottom: spacing.lg }}>
          <h4 style={{
            margin: `0 0 ${spacing.sm} 0`,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
          }}>
            Участники
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.sm }}>
            {isLoadingDetails ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: '50px', backgroundColor: colors.gray100, borderRadius: borderRadius.md, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            ) : (
              getParticipantsList().map((participant, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: spacing.sm,
                      backgroundColor: participant.isOrganizer ? colors.primary + '15' : colors.gray50,
                      borderRadius: borderRadius.md,
                      border: participant.isOrganizer ? `1px solid ${colors.primary}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
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
                    <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
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
                      {!participant.isOrganizer && (
                        (() => {
                          const badge = getStatusBadgeStyle(participant.status);
                          return (
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
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 🆕 Кнопка перехода в чат (показывается только если чат существует) */}
        {isParticipant && hasChat && (
          <div style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.primary + '10',
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.primary}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.primary,
              }}>
                Чат встречи
              </span>
            </div>
            <button
              onClick={() => setIsChatOpen(true)}
              disabled={!user?.accessToken}
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: user?.accessToken ? 'pointer' : 'not-allowed',
                opacity: user?.accessToken ? 1 : 0.6,
                transition: `all ${transitions.fast}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              }}
              onMouseOver={(e) => {
                if (user?.accessToken) {
                  e.currentTarget.style.backgroundColor = colors.primaryDark || '#0056b3';
                }
              }}
              onMouseOut={(e) => {
                if (user?.accessToken) {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Открыть чат
            </button>
          </div>
        )}

        {/* 🆕 Сообщение если чат не создан */}
        {isParticipant && !hasChat && (
          <div style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.gray100,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{
                fontSize: typography.fontSize.sm,
                color: colors.gray500,
              }}>
                Для этой встречи чат не был создан
              </span>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          paddingTop: spacing.lg,
          borderTop: `1px solid ${colors.gray200}`,
        }}>
          <button
            onClick={onClose}
            disabled={isLoadingDetails}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.white,
              color: colors.gray700,
              border: `1px solid ${colors.gray300}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: isLoadingDetails ? 'not-allowed' : 'pointer',
              opacity: isLoadingDetails ? 0.6 : 1,
              transition: `all ${transitions.normal}`,
            }}
            onMouseOver={(e) => {
              if (!isLoadingDetails) e.currentTarget.style.backgroundColor = colors.gray100;
            }}
            onMouseOut={(e) => {
              if (!isLoadingDetails) e.currentTarget.style.backgroundColor = colors.white;
            }}
          >
            Закрыть
          </button>
        </div>
      </div>

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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default EventDetailsModal;