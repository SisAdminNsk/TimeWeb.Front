import React, { useState, useEffect } from 'react';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import type { DetailedEventDto } from '../api/events/EventsContracts';
import ChatWindow from './ChatWindow';
import { FriendsSelectorForEvent } from './FriendsSelectorForEvent'; // 🆕

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
  const { getEventDetails, removeMember, addMemberToEvent } = useEvents(); // 🆕 addMemberToEvent
  const { user } = useAuth();
  
  const [eventDetails, setEventDetails] = useState<DetailedEventDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    participantId: string | null;
    participantUsername: string | null;
  }>({ isOpen: false, participantId: null, participantUsername: null });

  // 🆕 Состояние для модального окна добавления участника
  const [addMemberModal, setAddMemberModal] = useState<{
    isOpen: boolean;
    isLoading: boolean;
  }>({ isOpen: false, isLoading: false });

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
      setConfirmDeleteModal({ isOpen: false, participantId: null, participantUsername: null });
      setAddMemberModal({ isOpen: false, isLoading: false }); // 🆕
    }
  }, [isOpen]);

  if (!isOpen || !eventId) return null;

  const isCurrentUser = (username: string) => {
    return user && username === user.name;
  };

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
      id: eventDetails.initiator.userId,
      username: eventDetails.initiator.username,
      status: 'Accepted' as const,
      isOrganizer: true,
      isCurrentUser: isCurrentUser(eventDetails.initiator.username),
    };
    
    const otherMembers = (eventDetails.members || [])
      .filter(m => m.username !== eventDetails.initiator.username)
      .map(m => ({ 
        id: m.userId,
        ...m, 
        isOrganizer: false,
        isCurrentUser: isCurrentUser(m.username),
      }));
    
    return [organizer, ...otherMembers];
  };

  const isParticipant = eventDetails && (
    eventDetails.initiator.username === user?.name ||
    eventDetails.members?.some(m => m.username === user?.name)
  );

  const isInitiator = eventDetails && eventDetails.initiator.username === user?.name;

  const hasChat = eventDetails?.chatId !== null && eventDetails?.chatId !== undefined;

  const handleConfirmRemoveMember = async () => {
    const { participantId} = confirmDeleteModal;
    if (!participantId || !eventId) return;
    
    setRemovingMemberId(participantId);
    try {
      await removeMember(eventId, participantId);
      const updatedDetails = await getEventDetails(eventId);
      setEventDetails(updatedDetails);
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setRemovingMemberId(null);
      setConfirmDeleteModal({ isOpen: false, participantId: null, participantUsername: null });
    }
  };

  const handleCancelRemoveMember = () => {
    setConfirmDeleteModal({ isOpen: false, participantId: null, participantUsername: null });
  };

  // 🆕 Обработчик добавления участника
  const handleAddMember = async (friendId: string) => {
    if (!eventId) return;
    
    setAddMemberModal(prev => ({ ...prev, isLoading: true }));
    try {
      await addMemberToEvent(eventId, friendId);
      const updatedDetails = await getEventDetails(eventId);
      setEventDetails(updatedDetails);
      setAddMemberModal({ isOpen: false, isLoading: false });
    } catch (err) {
      console.error('Failed to add member:', err);
      setAddMemberModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 🆕 Обработчик отмены добавления
  const handleCancelAddMember = () => {
    setAddMemberModal({ isOpen: false, isLoading: false });
  };

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
    <>
      {/* Основное модальное окно */}
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
                      Дата и время проведения (GMT+7)
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
                      key={participant.id || index}
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
                        
                        {/* Кнопка удаления участника */}
                        {!participant.isOrganizer && !participant.isCurrentUser && isInitiator && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteModal({
                                isOpen: true,
                                participantId: participant.id,
                                participantUsername: participant.username,
                              });
                            }}
                            disabled={removingMemberId === participant.id}
                            title="Исключить участника"
                            style={{
                              background: 'transparent',
                              border: `1px solid ${colors.error}`,
                              color: colors.error,
                              borderRadius: borderRadius.sm,
                              padding: `${spacing.xs} ${spacing.sm}`,
                              fontSize: typography.fontSize.xs,
                              fontWeight: typography.fontWeight.medium,
                              cursor: removingMemberId === participant.id ? 'not-allowed' : 'pointer',
                              opacity: removingMemberId === participant.id ? 0.6 : 1,
                              transition: `all ${transitions.fast}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs,
                              marginLeft: spacing.xs,
                            }}
                            onMouseOver={(e) => {
                              if (removingMemberId !== participant.id) {
                                e.currentTarget.style.backgroundColor = colors.error;
                                e.currentTarget.style.color = colors.white;
                              }
                            }}
                            onMouseOut={(e) => {
                              if (removingMemberId !== participant.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.error;
                              }
                            }}
                          >
                            {removingMemberId === participant.id ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Исключаем...
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                                Исключить
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* 🆕 Кнопка добавления участника - видна только организатору */}
              {isInitiator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddMemberModal({ isOpen: true, isLoading: false });
                  }}
                  disabled={isLoadingDetails}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                    backgroundColor: 'transparent',
                    border: `2px dashed ${colors.gray300}`,
                    borderRadius: borderRadius.md,
                    color: colors.gray500,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    cursor: isLoadingDetails ? 'not-allowed' : 'pointer',
                    opacity: isLoadingDetails ? 0.6 : 1,
                    transition: `all ${transitions.fast}`,
                  }}
                  onMouseOver={(e) => {
                    if (!isLoadingDetails) {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.color = colors.primary;
                      e.currentTarget.style.backgroundColor = colors.primary + '10';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoadingDetails) {
                      e.currentTarget.style.borderColor = colors.gray300;
                      e.currentTarget.style.color = colors.gray500;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Добавить участника
                </button>
              )}
            </div>
          </div>

          {/* Кнопка перехода в чат */}
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
      </div>

      {/* 🆕 Модальное окно подтверждения удаления участника */}
      {confirmDeleteModal.isOpen && (
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
            zIndex: 2001,
            animation: 'fadeIn 0.2s ease',
            padding: spacing.md,
          }}
          onClick={handleCancelRemoveMember}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              boxShadow: shadows.xl,
              padding: spacing.xl,
              maxWidth: '400px',
              width: '100%',
              animation: 'slideIn 0.2s ease',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: spacing.lg }}>
              <h3 style={{
                margin: `0 0 ${spacing.sm} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.gray900,
              }}>
                Исключить участника?
              </h3>
              <p style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                color: colors.gray600,
                lineHeight: 1.5,
              }}>
                Вы действительно хотите исключить <strong>{confirmDeleteModal.participantUsername}</strong> из этой встречи? Это действие нельзя отменить.
              </p>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: spacing.sm,
            }}>
              <button
                onClick={handleCancelRemoveMember}
                disabled={removingMemberId !== null}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: colors.white,
                  color: colors.gray700,
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: removingMemberId !== null ? 'not-allowed' : 'pointer',
                  opacity: removingMemberId !== null ? 0.6 : 1,
                  transition: `all ${transitions.fast}`,
                }}
                onMouseOver={(e) => {
                  if (removingMemberId === null) e.currentTarget.style.backgroundColor = colors.gray100;
                }}
                onMouseOut={(e) => {
                  if (removingMemberId === null) e.currentTarget.style.backgroundColor = colors.white;
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmRemoveMember}
                disabled={removingMemberId !== null}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: colors.error,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: removingMemberId !== null ? 'not-allowed' : 'pointer',
                  opacity: removingMemberId !== null ? 0.6 : 1,
                  transition: `all ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
                onMouseOver={(e) => {
                  if (removingMemberId === null) {
                    e.currentTarget.style.backgroundColor = colors.errorDark || '#c82333';
                  }
                }}
                onMouseOut={(e) => {
                  if (removingMemberId === null) {
                    e.currentTarget.style.backgroundColor = colors.error;
                  }
                }}
              >
                {removingMemberId === confirmDeleteModal.participantId ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Исключаем...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Исключить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Модальное окно добавления участника */}
      {addMemberModal.isOpen && eventDetails && (
        <FriendsSelectorForEvent
          existingParticipantIds={getParticipantsList().map(p => p.id).filter(Boolean) as string[]}
          onConfirm={handleAddMember}
          onCancel={handleCancelAddMember}
        />
      )}

      {/* 🔄 Оверлей загрузки при отправке приглашения */}
      {addMemberModal.isOpen && addMemberModal.isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2003,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            backgroundColor: colors.white,
            padding: `${spacing.md} ${spacing.xl}`,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            boxShadow: shadows.md,
            pointerEvents: 'auto',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: typography.fontSize.sm, color: colors.gray700 }}>
              Отправка приглашения...
            </span>
          </div>
        </div>
      )}

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
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default EventDetailsModal;