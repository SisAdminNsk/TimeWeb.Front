import React, { useState, useRef, useEffect } from 'react';
import { useChatHub } from '../hooks/UseChatHub';
import { theme } from '../styles/theme';

interface ChatWindowProps {
  chatId: string;
  accessToken: string;
  onClose: () => void;
  currentUsername: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  accessToken,
  onClose,
  currentUsername,
}) => {
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isConnected,
    messages,
    sendMessage,
    joinChat,
    leaveChat,
    error,
  } = useChatHub(accessToken);

  // Подключение к чату при монтировании
  useEffect(() => {
    joinChat(chatId).catch((err) => {
      console.error('Failed to join chat:', err);
    });

    return () => {
      leaveChat(chatId).catch(console.error);
    };
  }, [chatId, joinChat, leaveChat]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending || !isConnected) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  // Группировка сообщений по датам
  const groupedMessages = messages.reduce((acc, message) => {
    const dateKey = formatRelativeDate(message.createdAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '500px',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.lg,
        overflow: 'hidden',
      }}
    >
      {/* Заголовок чата */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          backgroundColor: colors.primary,
          color: colors.white,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isConnected ? colors.success : colors.error,
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            Групповой чат
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: colors.white,
            fontSize: typography.fontSize.lg,
            padding: spacing.xs,
            transition: `all ${transitions.fast}`,
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          ✕
        </button>
      </div>

      {/* Статус подключения */}
      {!isConnected && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: colors.warningLight,
            color: colors.warningDark,
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
          }}
        >
          Подключение к чату...
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: colors.errorLight,
            color: colors.errorDark,
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Сообщения */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing.md,
          backgroundColor: colors.gray50,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: spacing.xl,
              color: colors.gray400,
              fontSize: typography.fontSize.sm,
            }}
          >
            Сообщений пока нет. Будьте первым!
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              <div
                style={{
                  textAlign: 'center',
                  margin: `${spacing.md} 0`,
                  fontSize: typography.fontSize.xs,
                  color: colors.gray400,
                }}
              >
                {dateKey}
              </div>
              {dateMessages.map((message) => {
                const isOwnMessage = message.senderId === currentUsername;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        backgroundColor: isOwnMessage ? colors.primary : colors.white,
                        color: isOwnMessage ? colors.white : colors.gray900,
                        borderRadius: borderRadius.lg,
                        borderBottomRightRadius: isOwnMessage ? borderRadius.sm : borderRadius.lg,
                        borderBottomLeftRadius: isOwnMessage ? borderRadius.lg : borderRadius.sm,
                        boxShadow: shadows.sm,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: typography.fontSize.sm,
                          lineHeight: 1.4,
                          wordBreak: 'break-word' as const,
                        }}
                      >
                        {message.content}
                      </p>
                      <div
                        style={{
                          textAlign: 'right',
                          marginTop: spacing.xs,
                          fontSize: typography.fontSize.xs,
                          opacity: 0.7,
                        }}
                      >
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          gap: spacing.sm,
          padding: spacing.md,
          backgroundColor: colors.white,
          borderTop: `1px solid ${colors.gray200}`,
        }}
      >
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Введите сообщение..."
          disabled={!isConnected || isSending}
          style={{
            flex: 1,
            padding: `${spacing.sm} ${spacing.md}`,
            border: `1px solid ${colors.gray300}`,
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.sm,
            outline: 'none',
            transition: `all ${transitions.fast}`,
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.primary)}
          onBlur={(e) => (e.target.style.borderColor = colors.gray300)}
        />
        <button
          type="submit"
          disabled={!messageInput.trim() || isSending || !isConnected}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            backgroundColor:
              !messageInput.trim() || isSending || !isConnected
                ? colors.gray300
                : colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            cursor:
              !messageInput.trim() || isSending || !isConnected
                ? 'not-allowed'
                : 'pointer',
            transition: `all ${transitions.fast}`,
          }}
        >
          {isSending ? '...' : 'Отправить'}
        </button>
      </form>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;