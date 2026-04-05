import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useChatHub } from '../hooks/UseChatHub';
import { theme } from '../styles/theme';

interface ChatWindowProps {
  chatId: string;
  onClose: () => void;
  currentUsername: string;
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
  date: string; // Храним оригинальную строку createdAt для конвертации
  id: string;
}

type ChatListItem = DateSeparator | Message;

const SCROLL_THRESHOLD = 100;
const SCROLL_OFFSET_FOR_NOTIFICATION = 300;

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  onClose,
  currentUsername,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = theme;
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
    if (!messageInput.trim() || isSending || !isConnected) return;

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

  // Формирование списка сообщений с разделителями дат
  // Важно: Группировка происходит по ЛОКАЛЬНОМУ времени устройства, а не UTC
  const messagesWithSeparators: ChatListItem[] = messages.reduce((acc, msg, idx) => {
    // Создаем объект даты. Если строка ISO (UTC), JS автоматически учтет это.
    const msgDate = new Date(msg.createdAt);
    
    // Получаем ключ даты на основе локального времени устройства (год-месяц-день)
    // Это гарантирует, что сообщения группируются по "вашему" дню, а не по дню на сервере
    const localDateKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`;
    
    const prevMsg = idx > 0 ? messages[idx - 1] : null;
    let prevLocalDateKey = null;
    
    if (prevMsg) {
      const prevDate = new Date(prevMsg.createdAt);
      prevLocalDateKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}-${prevDate.getDate()}`;
    }

    // Если локальная дата отличается от предыдущего сообщения, добавляем разделитель
    if (localDateKey !== prevLocalDateKey) {
      acc.push({ 
        type: 'separator', 
        date: msg.createdAt, // Сохраняем оригинальную строку для последующей конвертации
        id: `sep-${localDateKey}` 
      });
    }
    acc.push(msg);
    return acc;
  }, [] as ChatListItem[]);

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
      position: 'relative' 
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
        <h3 style={{ margin: 0, fontFamily: typography.fontFamily, fontSize: typography.fontSize.lg }}>Чат</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: colors.gray400 }}>×</button>
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
          background: colors.gray50 
        }}
      >
        {isLoadingHistory && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: colors.gray400, padding: '10px' }}>
            Загрузка истории...
          </div>
        )}
        
        {messagesWithSeparators.map((item) => {
          if ('type' in item) {
            // Конвертируем UTC время разделителя в локальное время устройства для отображения
            const dateObj = new Date(item.date);
            const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            
            return (
              <div key={item.id} style={{ textAlign: 'center', margin: '15px 0' }}>
                <span style={{ fontSize: '12px', color: colors.gray500, background: colors.gray200, padding: '2px 10px', borderRadius: '10px' }}>
                  {formattedDate}
                </span>
              </div>
            );
          }

          const isMine = item.username === currentUsername;
          
          // Конвертируем UTC время сообщения в локальное время устройства
          const timeObj = new Date(item.createdAt);
          const formattedTime = timeObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={item.id} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: isMine ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {!isMine && <span style={{ fontSize: '11px', color: colors.gray500, marginLeft: '5px' }}>{item.username}</span>}
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '12px', 
                backgroundColor: isMine ? colors.primary : colors.white,
                color: isMine ? colors.white : colors.gray800,
                boxShadow: shadows.sm,
                maxWidth: '85%',
                border: isMine ? 'none' : `1px solid ${colors.gray200}`
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word' }}>{item.content}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, textAlign: 'right', marginTop: '2px' }}>
                  {formattedTime}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* КНОПКА "ВНИЗ" */}
      {showNewMessageNotification && (
        <div 
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{ 
            position: 'absolute', 
            bottom: '90px', 
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
            gap: '5px'
          }}
        >
          Новые сообщения ({newMessageCount}) ↓
        </div>
      )}

      {/* INPUT AREA */}
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
            padding: '12px', 
            borderRadius: borderRadius.md, 
            border: `1px solid ${colors.gray300}`, 
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button 
          type="submit" 
          disabled={!messageInput.trim() || isSending || !isConnected}
          style={{ 
            padding: '0 20px', 
            backgroundColor: colors.primary, 
            color: 'white', 
            border: 'none', 
            borderRadius: borderRadius.md, 
            cursor: 'pointer',
            fontWeight: '600',
            opacity: (!messageInput.trim() || isSending) ? 0.6 : 1
          }}
        >
          {isSending ? '...' : 'Отправить'}
        </button>
      </form>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;