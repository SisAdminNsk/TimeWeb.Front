import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useChatHub } from '../hooks/UseChatHub';
import { theme } from '../styles/theme';

interface ChatWindowProps {
  chatId: string;
  onClose: () => void;
  currentUsername: string;
  chatTitle?: string;
  isPersonal?: boolean;
  participantId?: string;
  readOnly?: boolean; // ✅ Новый проп — только чтение
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  username: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface DateSeparator {
  type: 'separator';
  date: string;
  id: string;
}

type ChatListItem = DateSeparator | Message;

const SCROLL_THRESHOLD = 100;
const SCROLL_OFFSET_FOR_NOTIFICATION = 300;

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  onClose,
  currentUsername,
  chatTitle,
  isPersonal = false,
  readOnly = false, // ✅ По умолчанию — можно писать
}) => {
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollLockRef = useRef<boolean>(false);
  
  const isInitialLoad = useRef<boolean>(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  const previousScrollHeightRef = useRef<number>(0);

  const {
    isConnected,
    messages,
    sendMessage,
    joinChat,
    leaveChat,
    isLoadingHistory,
    hasMoreHistory,
    loadMoreHistory,
  } = useChatHub();

  useEffect(() => {
    joinChat(chatId).catch(console.error);
    return () => {
      leaveChat(chatId).catch(console.error);
    };
  }, [chatId, joinChat, leaveChat]);

  useLayoutEffect(() => {
    if (scrollLockRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const heightDiff = container.scrollHeight - previousScrollHeightRef.current;
      if (heightDiff > 0) {
        container.scrollTop += heightDiff;
      }
      scrollLockRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_OFFSET_FOR_NOTIFICATION;
    
    if (messages.length > previousMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessage.id;
        
        if (isNearBottom || isInitialLoad.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad.current ? 'auto' : 'smooth' });
          setShowNewMessageNotification(false);
          setNewMessageCount(0);
        } else {
          setShowNewMessageNotification(true);
          setNewMessageCount(prev => prev + 1);
        }
      }
    }
    
    if (isInitialLoad.current && messages.length > 0) {
      isInitialLoad.current = false;
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || scrollLockRef.current || isLoadingHistory) return;

    if (container.scrollTop < SCROLL_THRESHOLD && hasMoreHistory) {
      scrollLockRef.current = true;
      previousScrollHeightRef.current = container.scrollHeight;
      loadMoreHistory();
    }
    
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_OFFSET_FOR_NOTIFICATION;
    if (isNearBottom) {
      setShowNewMessageNotification(false);
      setNewMessageCount(0);
    }
  }, [hasMoreHistory, isLoadingHistory, loadMoreHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending || !isConnected || readOnly) return;

    setIsSending(true);
    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const messagesWithSeparators: ChatListItem[] = messages.reduce((acc, msg, idx) => {
    const msgDate = new Date(msg.createdAt);
    const localDateKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`;
    
    const prevMsg = idx > 0 ? messages[idx - 1] : null;
    let prevLocalDateKey = null;
    
    if (prevMsg) {
      const prevDate = new Date(prevMsg.createdAt);
      prevLocalDateKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}-${prevDate.getDate()}`;
    }

    if (localDateKey !== prevLocalDateKey) {
      acc.push({ 
        type: 'separator', 
        date: msg.createdAt,
        id: `sep-${localDateKey}` 
      });
    }
    acc.push(msg);
    return acc;
  }, [] as ChatListItem[]);

  const headerTitle = chatTitle || (isPersonal ? 'Личный чат' : 'Чат');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      maxHeight: '100%',
      backgroundColor: colors.white, 
      borderRadius: borderRadius.lg, 
      boxShadow: shadows.lg, 
      overflow: 'hidden', 
      position: 'relative',
      minWidth: '320px',
      maxWidth: '100%',
    }}>
      
      {/* HEADER */}
      <div style={{ 
        padding: spacing.md, 
        borderBottom: `1px solid ${colors.gray200}`, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: colors.white,
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          {isPersonal && (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontSize: '13px',
              fontWeight: typography.fontWeight.semibold,
              flexShrink: 0,
            }}>
              👤
            </div>
          )}
          
          <h3 style={{ 
            margin: 0, 
            fontFamily: typography.fontFamily, 
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
          }}>
            {headerTitle}
          </h3>
          
          {isPersonal && (
            <span style={{ 
              fontSize: typography.fontSize.xs || '10px', 
              color: colors.successDark,
              backgroundColor: colors.successLight,
              padding: `2px ${spacing.xs}`,
              borderRadius: borderRadius.sm,
              fontWeight: typography.fontWeight.medium,
              lineHeight: 1,
            }}>
              личный
            </span>
          )}

          {/* ✅ Бейдж "Только чтение" для прошедших встреч */}
          {readOnly && (
            <span style={{
              fontSize: typography.fontSize.xs || '10px',
              color: colors.gray600,
              backgroundColor: colors.gray200,
              padding: `2px ${spacing.xs}`,
              borderRadius: borderRadius.sm,
              fontWeight: typography.fontWeight.medium,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              архив
            </span>
          )}
        </div>
        
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '28px', 
            color: colors.gray400,
            padding: spacing.xs,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: borderRadius.sm,
            transition: `all ${transitions.fast}`,
            lineHeight: 1,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray100;
            e.currentTarget.style.color = colors.gray600;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.gray400;
          }}
          title="Закрыть чат"
          aria-label="Закрыть чат"
        >
          ×
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: spacing.md, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: spacing.sm, 
          background: colors.gray50,
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.gray300} ${colors.gray50}`,
          position: 'relative',
        }}
      >
        {isLoadingHistory && messages.length === 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.gray50,
            zIndex: 5,
            gap: spacing.md,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `4px solid ${colors.gray200}`,
              borderTopColor: colors.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{
              fontSize: typography.fontSize.sm || '13px',
              color: colors.gray500,
              fontWeight: typography.fontWeight.medium,
            }}>
              Открытие чата...
            </div>
          </div>
        )}

        {isLoadingHistory && messages.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: colors.gray400, padding: '10px' }}>
            Загрузка истории...
          </div>
        )}
        
        {messagesWithSeparators.map((item) => {
          if ('type' in item) {
            const dateObj = new Date(item.date);
            const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
            
            return (
              <div key={item.id} style={{ textAlign: 'center', margin: '15px 0' }}>
                <span style={{ 
                  fontSize: '11px', 
                  color: colors.gray500, 
                  background: colors.gray200, 
                  padding: '4px 12px', 
                  borderRadius: '12px',
                  fontWeight: typography.fontWeight.medium,
                }}>
                  {formattedDate}
                </span>
              </div>
            );
          }

          const isMine = item.username === currentUsername;
          const timeObj = new Date(item.createdAt);
          const formattedTime = timeObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

          return (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: isMine ? 'flex-end' : 'flex-start',
                animation: 'fadeIn 0.2s ease-out',
                maxWidth: '100%',
              }}
            >
              {!isMine && (
                <span style={{ 
                  fontSize: '11px', 
                  color: colors.gray500, 
                  marginLeft: '4px',
                  marginBottom: '2px',
                  fontWeight: typography.fontWeight.medium,
                }}>
                  {item.username}
                </span>
              )}
              
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '12px', 
                backgroundColor: isMine ? colors.primary : colors.white,
                color: isMine ? colors.white : colors.gray800,
                boxShadow: shadows.sm,
                maxWidth: '85%',
                border: isMine ? 'none' : `1px solid ${colors.gray200}`,
                wordBreak: 'break-word',
                // ✅ Для архивных чатов — чуть приглушённый вид
                opacity: readOnly ? 0.92 : 1,
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  {item.content}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.7, 
                  textAlign: 'right', 
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  {formattedTime}
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* КНОПКА "НОВЫЕ СООБЩЕНИЯ" */}
      {showNewMessageNotification && (
        <div 
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{ 
            position: 'absolute', 
            bottom: readOnly ? '70px' : '90px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            backgroundColor: colors.primary, 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            cursor: 'pointer', 
            fontSize: '13px', 
            boxShadow: shadows.lg, 
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: `transform ${transitions.fast}, box-shadow ${transitions.fast}`,
            fontWeight: typography.fontWeight.medium,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            e.currentTarget.style.boxShadow = shadows.xl;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            e.currentTarget.style.boxShadow = shadows.lg;
          }}
        >
          <span>↓</span>
          Новые сообщения ({newMessageCount})
        </div>
      )}

      {/* ✅ INPUT AREA — для readOnly показываем плашку вместо формы */}
      {readOnly ? (
        <div 
          style={{ 
            padding: spacing.md, 
            borderTop: `1px solid ${colors.gray200}`, 
            background: colors.gray100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            zIndex: 2,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.gray500} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{
            fontSize: typography.fontSize.sm,
            color: colors.gray600,
            fontWeight: typography.fontWeight.medium,
          }}>
            Встреча состоялась — чат доступен только для чтения
          </span>
        </div>
      ) : (
        <form 
          onSubmit={handleSendMessage} 
          style={{ 
            padding: spacing.md, 
            borderTop: `1px solid ${colors.gray200}`, 
            display: 'flex', 
            gap: spacing.sm, 
            background: colors.white,
            zIndex: 2
          }}
        >
          <input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Напишите сообщение..."
            style={{ 
              flex: 1, 
              padding: '12px 14px', 
              borderRadius: borderRadius.md, 
              border: `1px solid ${colors.gray300}`, 
              outline: 'none',
              fontSize: '14px',
              transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
              backgroundColor: colors.white,
              color: colors.gray900,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.gray300;
              e.target.style.boxShadow = 'none';
            }}
            disabled={!isConnected}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={!messageInput.trim() || isSending || !isConnected}
            style={{ 
              padding: '0 24px', 
              backgroundColor: colors.primary, 
              color: 'white', 
              border: 'none', 
              borderRadius: borderRadius.md, 
              cursor: 'pointer',
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              opacity: (!messageInput.trim() || isSending || !isConnected) ? 0.6 : 1,
              transition: `all ${transitions.fast}`,
              minWidth: '80px',
            }}
            onMouseOver={(e) => {
              if (messageInput.trim() && !isSending && isConnected) {
                e.currentTarget.style.backgroundColor = colors.primaryDark;
              }
            }}
            onMouseOut={(e) => {
              if (messageInput.trim() && !isSending && isConnected) {
                e.currentTarget.style.backgroundColor = colors.primary;
              }
            }}
          >
            {isSending ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ 
                  width: '12px', 
                  height: '12px', 
                  border: '2px solid rgba(255,255,255,0.3)', 
                  borderTopColor: 'white', 
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                ...
              </span>
            ) : 'Отправить'}
          </button>
        </form>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        [style*="overflowY: auto"]::-webkit-scrollbar {
          width: 6px;
        }
        [style*="overflowY: auto"]::-webkit-scrollbar-track {
          background: transparent;
        }
        [style*="overflowY: auto"]::-webkit-scrollbar-thumb {
          background: ${colors.gray300};
          border-radius: 3px;
        }
        [style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
          background: ${colors.gray400};
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;