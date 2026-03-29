// hooks/useChatHub.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface UseChatHubResult {
  isConnected: boolean;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  joinChat: (chatId: string) => Promise<void>;
  leaveChat: (chatId: string) => Promise<void>;
  error: string | null;
}

export const useChatHub = (accessToken: string | null): UseChatHubResult => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const currentChatId = useRef<string | null>(null);

  // Инициализация подключения
  useEffect(() => {
    if (!accessToken) {
      setError('Token not available');
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5003/chat', {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Обработчик получения сообщений
    newConnection.on('ReceiveMessage', (message: Message) => {
      setMessages((prev) => {
        // Избегаем дубликатов
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Обработчики состояния подключения
    newConnection.onclose(() => {
      setIsConnected(false);
    });

    newConnection.onreconnecting(() => {
      setIsConnected(false);
    });

    newConnection.onreconnected(() => {
      setIsConnected(true);
      // Переподключаемся к чату после восстановления соединения
      if (currentChatId.current) {
        newConnection.invoke('JoinChat', currentChatId.current).catch(console.error);
      }
    });

    setConnection(newConnection);

    return () => {
      newConnection.stop().catch(console.error);
    };
  }, [accessToken]);

  // Подключение к чату
  const joinChat = useCallback(async (chatId: string) => {
    if (!connection) {
      throw new Error('Connection not initialized');
    }

    try {
      setError(null);
      currentChatId.current = chatId;
      
      if (connection.state !== signalR.HubConnectionState.Connected) {
        await connection.start();
      }
      
      await connection.invoke('JoinChat', chatId);
      setIsConnected(true);
      setMessages([]); // Очищаем сообщения при входе в новый чат
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join chat';
      setError(errorMessage);
      throw err;
    }
  }, [connection]);

  // Отправка сообщения
  const sendMessage = useCallback(async (content: string) => {
    if (!connection || !currentChatId.current) {
      throw new Error('Not connected to chat');
    }

    try {
      await connection.invoke('SendMessage', currentChatId.current, content);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    }
  }, [connection]);

  // Выход из чата
  const leaveChat = useCallback(async (chatId: string) => {
    if (!connection) {
      return;
    }

    try {
      await connection.invoke('LeaveChat', chatId);
      currentChatId.current = null;
    } catch (err) {
      console.error('Failed to leave chat:', err);
    }
  }, [connection]);

  return {
    isConnected,
    messages,
    sendMessage,
    joinChat,
    leaveChat,
    error,
  };
};