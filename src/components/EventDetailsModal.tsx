import React, { useState, useEffect, useMemo } from 'react';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import type { DetailedEventDto } from '../api/events/EventsContracts';
import ChatWindow from './ChatWindow';
import { FriendsSelectorForEvent } from './FriendsSelectorForEvent';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { config } from '../config/env';
import { chatsClient } from '../api/chats/ChatsClient';

const API_BASE_URL = config.apiUrl;
const LIVEKIT_SERVER_URL = config.liveServerUrl;

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
  const { getEventDetails, removeMember, addMemberToEvent } = useEvents();
  const { user } = useAuth();

  const [eventDetails, setEventDetails] = useState<DetailedEventDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    participantId: string | null;
    participantUsername: string | null;
  }>({ isOpen: false, participantId: null, participantUsername: null });
  const [addMemberModal, setAddMemberModal] = useState<{
    isOpen: boolean;
    isLoading: boolean;
  }>({ isOpen: false, isLoading: false });

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const checkEventChatUpdates = async (chatId: string) => {
    if (!user?.accessToken) return;

    try {
      const response = await chatsClient.checkUpdates(user.accessToken, chatId);
      const hasUpdates = response.updates?.[0]?.hasUpdates ?? false;
      setHasUnreadMessages(hasUpdates);
    } catch (err) {
      console.error('Failed to check event chat updates:', err);
      setHasUnreadMessages(false);
    }
  };

  const markEventChatAsViewed = async (chatId: string) => {
    if (!user?.accessToken) return;

    try {
      await chatsClient.markAsViewed(user.accessToken, chatId);
      setHasUnreadMessages(false);
    } catch (err) {
      console.error('Failed to mark event chat as viewed:', err);
    }
  };

  // ✅ НОВАЯ ФУНКЦИЯ: закрытие чата с отправкой MarkAsRead
  const handleCloseChat = async () => {
    const chatId = getChatId();
    if (chatId && user?.accessToken) {
      try {
        await markEventChatAsViewed(chatId);
      } catch (err) {
        console.error('Failed to mark chat as viewed on close:', err);
      }
    }
    setIsChatOpen(false);
  };

  useEffect(() => {
    if (isOpen && eventId) {
      setIsLoadingDetails(true);
      setEventDetails(null);
      setHasUnreadMessages(false);

      getEventDetails(eventId)
        .then(async (data) => {
          setEventDetails(data);
          if (data?.chatId) {
            const isUserParticipant =
              data.initiator.username === user?.name ||
              data.members?.some(m => m.username === user?.name);

            if (isUserParticipant) {
              await checkEventChatUpdates(data.chatId);
            }
          }
        })
        .catch(err => console.error('Failed to load event details:', err))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [isOpen, eventId, getEventDetails]);

  useEffect(() => {
    if (!isOpen) {
      // ✅ Если чат был открыт — помечаем как прочитанный перед сбросом
      if (isChatOpen) {
        const chatId = eventDetails?.chatId;
        if (chatId && user?.accessToken) {
          markEventChatAsViewed(chatId).catch(err =>
            console.error('Failed to mark chat as viewed on modal close:', err)
          );
        }
      }
      setIsChatOpen(false);
      setIsVideoCallOpen(false);
      setVideoToken(null);
      setVideoError(null);
      setConfirmDeleteModal({ isOpen: false, participantId: null, participantUsername: null });
      setAddMemberModal({ isOpen: false, isLoading: false });
      setHasUnreadMessages(false);
    }
  }, [isOpen]);

  // ... (MutationObserver для LiveKit остаётся без изменений)
  useEffect(() => {
    if (!isVideoCallOpen) return;

    const translations: Record<string, string> = {
      'Microphone': 'Микрофон',
      'Camera': 'Камера',
      'Share screen': 'Поделиться экраном',
      'Leave': 'Покинуть',
      'Chat': 'Чат',
      'Participants': 'Участники',
      'Unmute microphone': 'Включить микрофон',
      'Mute microphone': 'Выключить микрофон',
      'Start video': 'Включить камеру',
      'Stop video': 'Выключить камеру',
      'Start screen share': 'Начать демонстрацию экрана',
      'Stop screen share': 'Остановить демонстрацию экрана',
      'Send': 'Отправить',
      'Type a message...': 'Введите сообщение...',
      'Type a message': 'Введите сообщение',
      'Chat is empty': 'Чат пуст',
      'No participants': 'Нет участников',
      'You': 'Вы',
      'Connecting...': 'Подключение...',
      'Reconnecting...': 'Переподключение...',
      'Disconnected': 'Отключено',
      'Screen share': 'Демонстрация экрана',
      'Settings': 'Настройки',
      'Devices': 'Устройства',
      'Muted': 'Выключен',
      'Speaking': 'Говорит',
      'Unmute': 'Включить',
      'Mute': 'Выключить',
    };

    const processNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (!el.closest('[data-lk-theme]')) return;

        ['aria-label', 'title', 'placeholder'].forEach(attr => {
          const val = el.getAttribute(attr);
          if (val && translations[val]) {
            el.setAttribute(attr, translations[val]);
          }
        });

        const ariaLabel = el.getAttribute('aria-label');

        if (ariaLabel === 'Leave' || ariaLabel === 'Покинуть') {
          el.style.display = 'none';
        }

        if (ariaLabel === 'Chat' || ariaLabel === 'Чат') {
          if (el.closest('.lk-control-bar') || el.closest('.lk-button') || el.closest('[class*="lk-"]')) {
            el.style.display = 'none';
          }
        }
      }
      else if (node.nodeType === Node.TEXT_NODE) {
        if (!node.parentElement?.closest('[data-lk-theme]')) return;
        const text = node.textContent?.trim();
        if (text && translations[text]) {
          node.textContent = translations[text];
        }
      }
    };

    const processTree = (root: Node) => {
      processNode(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, null);
      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        processNode(currentNode);
        currentNode = walker.nextNode();
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => processTree(node));
        if (mutation.type === 'attributes' && mutation.target) {
          processNode(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    processTree(document.body);

    return () => {
      observer.disconnect();
    };
  }, [isVideoCallOpen]);

  const isEventPassed = useMemo(() => {
    if (!eventDetails?.endAt) return false;
    return new Date(eventDetails.endAt).getTime() < Date.now();
  }, [eventDetails?.endAt]);

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

  const fetchVideoToken = async () => {
    if (!eventId || !user?.name || !user?.accessToken) return;
    setIsTokenLoading(true);
    setVideoError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/videos/token?roomName=${encodeURIComponent(eventId)}`,
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('Токен не получен от сервера');
      }

      setVideoToken(data.token);
      setIsVideoCallOpen(true);
    } catch (err) {
      console.error('Failed to fetch video token:', err);
      setVideoError(err instanceof Error ? err.message : 'Не удалось подключиться к звонку');
    } finally {
      setIsTokenLoading(false);
    }
  };

  const handleOpenVideoCall = () => {
    if (videoToken) {
      setIsVideoCallOpen(true);
    } else {
      fetchVideoToken();
    }
  };

  // ✅ ОБНОВЛЁННАЯ ФУНКЦИЯ: при выходе из звонка помечаем чат как прочитанный
  // (если он был открыт) и проверяем обновления чата
  const handleCloseVideoCall = async () => {
    const chatId = getChatId();

    // Если чат был открыт во время звонка — помечаем как прочитанный
    if (isChatOpen && chatId && user?.accessToken) {
      try {
        await markEventChatAsViewed(chatId);
      } catch (err) {
        console.error('Failed to mark chat as viewed on call close:', err);
      }
    }

    setIsVideoCallOpen(false);
    setIsChatOpen(false);
    setVideoToken(null);
    setVideoError(null);

    // ✅ Проверяем обновления чата после выхода из звонка
    if (chatId && user?.accessToken) {
      try {
        await checkEventChatUpdates(chatId);
      } catch (err) {
        console.error('Failed to check chat updates after call:', err);
      }
    }
  };

  const handleConfirmRemoveMember = async () => {
    const { participantId } = confirmDeleteModal;
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

  const handleCancelAddMember = () => {
    setAddMemberModal({ isOpen: false, isLoading: false });
  };

  if (isVideoCallOpen) {
    if (!videoToken) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{
            backgroundColor: colors.white,
            padding: `${spacing.lg} ${spacing.xl}`,
            borderRadius: borderRadius.xl,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.md,
            boxShadow: shadows.xl,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: typography.fontSize.base, color: colors.gray700, fontWeight: typography.fontWeight.medium }}>
              Подключение к звонку...
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        data-lk-theme="default"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#111827',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Хедер */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${spacing.md} ${spacing.lg}`,
          backgroundColor: '#1f2937',
          borderBottom: '1px solid #374151',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div style={{
              width: '36px',
              height: '36px',
              backgroundColor: colors.error,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
              }}>
                {eventDetails?.title || 'Видеозвонок'}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#9ca3af',
                marginTop: '2px',
              }}>
                Комната: {eventId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            {hasChat && user?.accessToken && (
              <button
                onClick={async () => {
                  const willOpen = !isChatOpen;
                  if (willOpen) {
                    setIsChatOpen(true);
                    const chatId = getChatId();
                    if (chatId) {
                      await markEventChatAsViewed(chatId);
                    }
                  } else {
                    // ✅ При закрытии чата из звонка — помечаем как прочитанный
                    await handleCloseChat();
                  }
                }}
                title={isChatOpen ? 'Закрыть чат' : 'Открыть чат'}
                style={{
                  background: isChatOpen
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.lg,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  transition: `all ${transitions.fast}`,
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {isChatOpen ? 'Закрыть чат' : 'Чат'}
                {hasUnreadMessages && !isChatOpen && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: colors.error,
                    borderRadius: '50%',
                    border: '2px solid #1f2937',
                    boxShadow: '0 0 0 1px ' + colors.error,
                  }} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* LiveKit конференция */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <style>{`
            [data-lk-theme="default"] {
              --lk-color-background: #111827;
            }

            [data-lk-theme] [aria-label="Leave"],
            [data-lk-theme] [aria-label="Покинуть"],
            [data-lk-theme] [title="Leave"],
            [data-lk-theme] [title="Покинуть"],
            [data-lk-theme] .lk-leave-button {
              display: none !important;
              visibility: hidden !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
              position: absolute !important;
              pointer-events: none !important;
            }

            [data-lk-theme] .lk-chat-toggle,
            [data-lk-theme] .lk-chat,
            [data-lk-theme] .lk-chat-trigger {
              display: none !important;
              visibility: hidden !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
              position: absolute !important;
              pointer-events: none !important;
            }

            .lk-button {
              background-color: #374151 !important;
              border: 2px solid #4b5563 !important;
              border-radius: 12px !important;
              transition: all 0.2s ease !important;
            }

            .lk-button:hover {
              background-color: #4b5563 !important;
              border-color: #6b7280 !important;
              transform: scale(1.05) !important;
            }

            .lk-button[data-lk-muted='true'] {
              background-color: #ef4444 !important;
              border-color: #dc2626 !important;
            }

            [data-lk-theme="default"] .lk-control-bar {
              background-color: rgba(31, 41, 55, 0.95) !important;
              backdrop-filter: blur(10px) !important;
              border: 1px solid #374151 !important;
              padding: 16px !important;
              border-radius: 16px !important;
              margin: 0 16px 16px 16px !important;
              width: calc(100% - 32px) !important;
              box-sizing: border-box !important;
              bottom: 16px !important;
            }

            [data-lk-theme="default"] .lk-footer {
              padding: 0 !important;
              margin: 0 !important;
            }

            .lk-participant-tile {
              border-radius: 16px !important;
              overflow: hidden !important;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            }
          `}</style>

          <LiveKitRoom
            serverUrl={LIVEKIT_SERVER_URL}
            token={videoToken}
            connect={true}
            audio={true}
            video={true}
            style={{ height: '100%', width: '100%' }}
            onDisconnected={handleCloseVideoCall}
          >
            <VideoConference />
          </LiveKitRoom>

          {isChatOpen && hasChat && getChatId() && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                bottom: '100px',
                width: '380px',
                maxWidth: 'calc(100% - 32px)',
                zIndex: 10,
                borderRadius: borderRadius.xl,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                animation: 'slideInRight 0.25s ease',
              }}
            >
              <ChatWindow
                chatId={getChatId()!}
                onClose={handleCloseChat}
                currentUsername={user?.name || ''}
                readOnly={isEventPassed}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Рендер чата (отдельное окно из модалки)
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
            onClose={handleCloseChat}
            currentUsername={user?.name || ''}
            readOnly={isEventPassed}
          />
        </div>
      </div>
    );
  }

  return (
    <>
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
          {/* HEADER */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.gray900,
                  }}>
                    {eventDetails?.title || 'Загрузка...'}
                  </h3>
                  {isEventPassed && (
                    <span style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: colors.gray200,
                      color: colors.gray600,
                      borderRadius: borderRadius.full,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Состоялась
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

          {/* DATE BLOCK */}
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
                  border: `1px solid ${isEventPassed ? colors.gray300 : colors.primary}`,
                  opacity: isEventPassed ? 0.85 : 1,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isEventPassed ? colors.gray500 : colors.primary} strokeWidth="2">
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

          {/* DESCRIPTION */}
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

          {/* VIDEO CALL SECTION */}
          {isParticipant && (
            <div style={{
              marginBottom: spacing.lg,
              padding: spacing.md,
              backgroundColor: isEventPassed
                ? colors.gray100
                : colors.successLight,
              borderRadius: borderRadius.md,
              border: `1px solid ${isEventPassed
                ? colors.gray300
                : colors.success}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isEventPassed ? colors.gray500 : colors.success} strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: isEventPassed ? colors.gray600 : colors.successDark,
                }}>
                  {isEventPassed
                    ? 'Видеозвонок (недоступен)'
                    : 'Видеозвонок'}
                </span>
              </div>

              {isEventPassed && (
                <p style={{
                  margin: `0 0 ${spacing.sm} 0`,
                  fontSize: typography.fontSize.xs,
                  color: colors.gray600,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}>
                  Встреча уже состоялась. Видеозвонок недоступен.
                </p>
              )}

              {videoError && (
                <div style={{
                  marginBottom: spacing.sm,
                  padding: spacing.sm,
                  backgroundColor: colors.errorLight,
                  color: colors.errorDark,
                  borderRadius: borderRadius.sm,
                  fontSize: typography.fontSize.xs,
                }}>
                  {videoError}
                </div>
              )}

              <button
                onClick={handleOpenVideoCall}
                disabled={isEventPassed || isTokenLoading || !user?.accessToken}
                style={{
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: isEventPassed
                    ? colors.gray400
                    : colors.success,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: isEventPassed || isTokenLoading || !user?.accessToken
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: isEventPassed || !user?.accessToken ? 0.6 : 1,
                  transition: `all ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
                onMouseOver={(e) => {
                  if (!isEventPassed && !isTokenLoading && user?.accessToken) {
                    e.currentTarget.style.backgroundColor = colors.successDark || '#1e7e34';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isEventPassed && !isTokenLoading && user?.accessToken) {
                    e.currentTarget.style.backgroundColor = colors.success;
                  }
                }}
              >
                {isTokenLoading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Подключение...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    {isEventPassed ? 'Недоступно' : 'Подключиться'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* PARTICIPANTS */}
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
                  const canRemoveMember = !participant.isOrganizer
                    && !participant.isCurrentUser
                    && isInitiator
                    && !isEventPassed;

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

                        {canRemoveMember && (
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

              {isInitiator && !isEventPassed && (
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

          {/* CHAT SECTION */}
          {isParticipant && hasChat && (
            <div style={{
              marginBottom: spacing.lg,
              padding: spacing.md,
              backgroundColor: isEventPassed ? colors.gray100 : colors.primary + '10',
              borderRadius: borderRadius.md,
              border: `1px solid ${hasUnreadMessages && !isEventPassed ? colors.error : (isEventPassed ? colors.gray300 : colors.primary)}`,
              transition: `border-color ${transitions.fast}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isEventPassed ? colors.gray500 : colors.primary} strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: isEventPassed ? colors.gray600 : colors.primary,
                }}>
                  {isEventPassed ? 'Чат встречи (архив)' : 'Чат встречи'}
                </span>
                {hasUnreadMessages && !isEventPassed && (
                  <span style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    backgroundColor: colors.error,
                    color: colors.white,
                    borderRadius: borderRadius.full,
                    fontSize: '11px',
                    fontWeight: typography.fontWeight.bold,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Непрочитано
                  </span>
                )}
              </div>

              {isEventPassed && (
                <p style={{
                  margin: `0 0 ${spacing.sm} 0`,
                  fontSize: typography.fontSize.xs,
                  color: colors.gray600,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}>
                  Встреча уже состоялась. Переписка доступна только для чтения.
                </p>
              )}

              <button
                onClick={async () => {
                  setIsChatOpen(true);
                  const chatId = getChatId();
                  if (chatId) {
                    await markEventChatAsViewed(chatId);
                  }
                }}
                disabled={!user?.accessToken}
                style={{
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: isEventPassed ? colors.gray500 : colors.primary,
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
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  if (user?.accessToken) {
                    e.currentTarget.style.backgroundColor = isEventPassed
                      ? (colors.gray600 || '#555')
                      : (colors.primaryDark || '#0056b3');
                  }
                }}
                onMouseOut={(e) => {
                  if (user?.accessToken) {
                    e.currentTarget.style.backgroundColor = isEventPassed ? colors.gray500 : colors.primary;
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {isEventPassed ? 'Читать' : 'Открыть'}
                {hasUnreadMessages && !isEventPassed && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '18px',
                    height: '18px',
                    backgroundColor: colors.error,
                    color: colors.white,
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: typography.fontWeight.bold,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid ' + colors.white,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}>
                    !
                  </span>
                )}
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

      {/* Модалка подтверждения удаления участника */}
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

      {/* Модалка добавления участника */}
      {addMemberModal.isOpen && eventDetails && (
        <FriendsSelectorForEvent
          existingParticipantIds={getParticipantsList().map(p => p.id).filter(Boolean) as string[]}
          onConfirm={handleAddMember}
          onCancel={handleCancelAddMember}
        />
      )}

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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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